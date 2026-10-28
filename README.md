# Apex V – Exotic Rivalry

A browser-based real-time multiplayer top-down exotic-car racing game. Players join the same room from separate phones or computers using a shared public URL and room code.

## Included
- Node.js + Express server and Socket.IO live multiplayer state
- Up to 8 players per room
- Three selectable car names, unique racer colors, shared room code
- Keyboard and touch controls
- In-game rules, waiting lobby, ready check, 3-lap race, winner screen
- Responsive layout for mobile and desktop

## Run locally
1. Install Node.js 18 or newer.
2. Extract this project and open a terminal in the project folder.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000`

For testing on a second device on the same Wi-Fi, use your computer's local network IP address instead of `localhost`, e.g. `http://192.168.1.20:3000`. Both devices must be on the same network for this local method.

## Deploy to a public URL with Render (recommended)
You need a free GitHub account and a Render account. This project is ready to deploy as a Node web service.

1. Sign in to GitHub and create a new repository named `apex-v-exotic-rivalry`.
2. Upload all project files and the `public` folder to the repository (the `package.json`, `server.js`, and `README.md` must be at the repository root).
3. Sign in to Render and choose **New + → Web Service**.
4. Connect the GitHub repository.
5. Set:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free, if offered for your account/region
6. Click **Create Web Service** and wait for deployment to finish.
7. Render will give you a public URL similar to `https://your-service-name.onrender.com`. Copy the actual URL Render assigns; do not use the example.
8. Open that URL on your first device. Open it on a second phone/computer, enter the same room code (e.g. `APEX7`), choose a name, and tap **Join Race** on both devices.
9. Both players tap **I'm Ready**. The race begins once at least two players have joined and every player in the room is ready.

## Notes / limitations
- This is a playable multiplayer prototype with a top-down arcade-style track, not a photorealistic 3D simulator. Realistic 3D graphics, advanced collision physics, matchmaking, accounts, persistent leaderboards, and production-grade anti-cheat would require further development.
- Free hosting may sleep when idle, so the first load after inactivity can take a little longer.
- Room state lives in server memory and resets if the service restarts.
- This is a prototype: the server processes driving input and shares positions in real time, but it is not designed for competitive or security-critical use.
