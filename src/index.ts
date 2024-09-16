import express from "express";
import { Server as SockerSetver } from "socket.io";
import http from "http";

const app = express();
const server = new http.Server(app);
const io = new SockerSetver(server);

io.on("connection", (socket) => {
  console.log("New connection ", socket.id);

  socket.on("board", (data) => {
    socket.broadcast.emit("board", {
      body: {
        index: data.index,
        value: data.value,
        player: data.player,
      },
      from: socket.id,
    });
  });
});

server.listen(3000, () => {
  console.log(`Server listening on http://localhost:${3000}`);
});
