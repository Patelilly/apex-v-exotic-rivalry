
const canvas = document.getElementById("gameCanvas");

if (canvas) {
  const ctx = canvas.getContext("2d");

  function drawGame() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#246b35";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#353940";
    ctx.fillRect(w * 0.15, 0, w * 0.7, h);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.setLineDash([24, 18]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    function car(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x - 15, y - 25, 30, 50);
      ctx.fillStyle = "#b9eaff";
      ctx.fillRect(x - 10, y - 16, 20, 12);
      ctx.fillStyle = "#111111";
      ctx.fillRect(x - 19, y - 17, 5, 13);
      ctx.fillRect(x + 14, y - 17, 5, 13);
      ctx.fillRect(x - 19, y + 9, 5, 13);
      ctx.fillRect(x + 14, y + 9, 5, 13);
    }

    car(w * 0.38, h * 0.7, "#ff453a");
    car(w * 0.62, h * 0.4, "#20a4ff");
  }

  drawGame();
}
