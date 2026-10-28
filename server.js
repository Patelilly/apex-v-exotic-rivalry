const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true, game: "Apex V – Exotic Rivalry" }));

const rooms = new Map();
const TRACK = { x: 90, y: 70, w: 720, h: 460, innerX: 230, innerY: 175, innerW: 440, innerH: 250 };
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const safeName = (s) => String(s || "Racer").replace(/[<>]/g, "").trim().slice(0, 18) || "Racer";
const safeRoom = (s) => String(s || "APEX").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "APEX";

function roomFor(code) {
  if (!rooms.has(code)) rooms.set(code, { code, players: new Map(), started: false, finished: false, startedAt: null, winner: null });
  return rooms.get(code);
}
function publicState(room) {
  return {
    code: room.code, started: room.started, finished: room.finished, winner: room.winner,
    players: [...room.players.values()].map(p => ({
      id: p.id, name: p.name, car: p.car, color: p.color, x: p.x, y: p.y, angle: p.angle,
      lap: p.lap, checkpoint: p.checkpoint, finished: p.finished, speed: p.speed, ready: p.ready
    }))
  };
}
function broadcast(room) { io.to(room.code).emit("state", publicState(room)); }
function resetRace(room) {
  room.started = true; room.finished = false; room.startedAt = Date.now(); room.winner = null;
  let i = 0;
  for (const p of room.players.values()) {
    p.x = 360 + i * 52; p.y = 96 + (i % 2) * 34; p.angle = Math.PI / 2;
    p.lap = 0; p.checkpoint = 0; p.finished = false; p.speed = 0; p.ready = false; i++;
  }
}
io.on("connection", socket => {
  socket.on("join", ({ name, room: requestedRoom, car }) => {
    if (socket.data.room) {
      const old = rooms.get(socket.data.room);
      if (old) { old.players.delete(socket.id); broadcast(old); if (!old.players.size) rooms.delete(old.code); }
      socket.leave(socket.data.room);
    }
    const code = safeRoom(requestedRoom);
    const room = roomFor(code);
    if (room.players.size >= 8) return socket.emit("errorMessage", "This room is full (maximum 8 racers). Try another room code.");
    socket.join(code); socket.data.room = code;
    const colors = ["#ff4d4d", "#39bdf8", "#f8c34a", "#b38cff", "#52e0a0", "#ff8fcb", "#f28b45", "#d7e3ee"];
    const idx = room.players.size % colors.length;
    room.players.set(socket.id, {
      id: socket.id, name: safeName(name), car: ["Vortex GT", "Apex R", "Strada X"].includes(car) ? car : "Vortex GT",
      color: colors[idx], x: 360 + idx * 52, y: 96 + (idx % 2) * 34, angle: Math.PI / 2,
      lap: 0, checkpoint: 0, finished: false, speed: 0, ready: false, lastUpdate: 0
    });
    socket.emit("joined", { id: socket.id, room: code });
    broadcast(room);
  });
  socket.on("ready", () => {
    const room = rooms.get(socket.data.room); if (!room) return;
    const p = room.players.get(socket.id); if (!p) return;
    p.ready = true;
    if (room.players.size >= 2 && [...room.players.values()].every(x => x.ready) && !room.started) resetRace(room);
    broadcast(room);
  });
  socket.on("drive", input => {
    const room = rooms.get(socket.data.room); if (!room || !room.started || room.finished) return;
    const p = room.players.get(socket.id); if (!p || p.finished) return;
    const now = Date.now();
    if (now - p.lastUpdate < 28) return; // rate limit client updates
    p.lastUpdate = now;
    const dt = clamp(Number(input.dt) || 0.03, 0.01, 0.06);
    const throttle = clamp(Number(input.throttle) || 0, 0, 1);
    const brake = clamp(Number(input.brake) || 0, 0, 1);
    const steer = clamp(Number(input.steer) || 0, -1, 1);
    let speed = p.speed;
    speed += throttle * 185 * dt;
    speed -= brake * 260 * dt;
    speed -= (throttle === 0 && brake === 0 ? 42 : 9) * dt;
    speed = clamp(speed, 0, 240);
    const onTrack = (
      p.x >= TRACK.x && p.x <= TRACK.x + TRACK.w && p.y >= TRACK.y && p.y <= TRACK.y + TRACK.h &&
      !(p.x > TRACK.innerX && p.x < TRACK.innerX + TRACK.innerW && p.y > TRACK.innerY && p.y < TRACK.innerY + TRACK.innerH)
    );
    const actualSpeed = onTrack ? speed : speed * 0.45;
    p.angle += steer * (actualSpeed / 240) * 2.4 * dt;
    p.x += Math.sin(p.angle) * actualSpeed * dt;
    p.y -= Math.cos(p.angle) * actualSpeed * dt;
    p.speed = speed;

    // Progress checkpoints around the oval. Each checkpoint can only advance in order.
    const zones = [
      p.x > 340 && p.x < 570 && p.y < 150,
      p.x > 650 && p.y > 150 && p.y < 430,
      p.x > 330 && p.x < 570 && p.y > 440,
      p.x < 210 && p.y > 150 && p.y < 430
    ];
    const expected = room._unused; // harmless placeholder avoids trusting client lap claims
    const next = (p.checkpoint + 1) % 4;
    if (zones[next] && p.checkpoint !== next) {
      if (next === 0) {
        if (p.checkpoint === 3) p.lap += 1;
      }
      p.checkpoint = next;
      if (p.lap >= 3) { p.finished = true; p.speed = 0; if (!room.winner) room.winner = p.name; room.finished = true; }
    }
    broadcast(room);
  });
  socket.on("restart", () => {
    const room = rooms.get(socket.data.room); if (!room) return;
    if (room.players.size >= 2) {
      for (const p of room.players.values()) p.ready = false;
      room.started = false; room.finished = false; room.winner = null;
      broadcast(room);
    }
  });
  socket.on("disconnect", () => {
    const code = socket.data.room, room = rooms.get(code); if (!room) return;
    room.players.delete(socket.id);
    if (!room.players.size) rooms.delete(code); else broadcast(room);
  });
});

server.listen(PORT, "0.0.0.0", () => console.log(`Apex V running on port ${PORT}`));
