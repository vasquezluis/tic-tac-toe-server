import express from "express";
import { Server as SockerSetver, type Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import http from "http";

const app = express();
const server = new http.Server(app);
const io = new SockerSetver(server);

const MAX_PLAYERS = 2;
const rooms: Record<string, string[]> = {};

const setupGameListeners = (socket: Socket, roomCode: string) => {
  //? broadcast value of turn to players
  socket.on("board", (data: { index: number; value: string }) => {
    console.log({ data });
    socket.to(roomCode).emit("board", {
      body: {
        index: data.index,
        value: data.value,
      },
      from: socket.id,
    });
  });

  //? broadcast reset the game when someone wins
  socket.on("resetGame", () => {
    console.log("Resetting game in room", roomCode);
    socket.to(roomCode).emit("resetGame");
  });

  //? handle player disconnecting
  socket.on("disconnect", () => {
    console.log(`Player ${socket.id} disconnected from room ${roomCode}`);
    rooms[roomCode] = rooms[roomCode].filter((id) => id !== socket.id);
    if (rooms[roomCode].length === 0) {
      delete rooms[roomCode];
    }
  });
};

io.on("connection", (socket: Socket) => {
  console.log("New connection", socket.id);

  socket.on("createRoom", () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = [socket.id];
    socket.join(roomCode); // join the creator of the room

    console.log(`player ${socket.id} created room ${roomCode}`);
    socket.emit("roomCreated", { roomCode, player: 1 });

    // ? common listeners
    setupGameListeners(socket, roomCode);
  });

  socket.on("joinRoom", (roomCode: string) => {
    if (!rooms[roomCode]) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    if (rooms[roomCode].length >= MAX_PLAYERS) {
      socket.emit("error", { message: "Room already full" });
      return;
    }

    rooms[roomCode].push(socket.id);
    socket.join(roomCode); // new connection with code join room
    console.log(`${socket.id} joined ${roomCode}`);

    const playerNumber = 2;
    socket.emit("roomJoined", { roomCode, player: playerNumber });
    socket.to(roomCode).emit("player", { player: 2 });

    // ? common listeners
    setupGameListeners(socket, roomCode);
  });
});

//? create a new room
function generateRoomCode(): string {
  return uuidv4().slice(0, 6); // Generate a 6-character unique code
}

server.listen(3000, () => {
  console.log(`Server listening on http://localhost:${3000}`);
});
