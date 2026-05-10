const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  // 🧠 Username speichern
  socket.on("set-name", (name) => {
    socket.username = name;
  });

  // 🔗 Matching System
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("matched");
    waitingUser.emit("matched");

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  // 💬 Nachrichten
  socket.on("message", (data) => {
    if (!socket.partner) return;

    socket.partner.emit("message", {
      text: data.text,
      name: data.name || "Anon"
    });
  });

  // ❌ Disconnect Handling
  socket.on("disconnect", () => {
    if (waitingUser === socket) waitingUser = null;

    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});