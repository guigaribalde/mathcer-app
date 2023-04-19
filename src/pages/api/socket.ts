import type { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";

const SocketHandler = (req: NextApiRequest, res: any) => {
  if (res.socket.server.io) {
    console.log("Socket is already running");
    return res.end();
  }
  console.log("Socket is initializing");
  //creates a socket server for each room
  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  const users: any = {};
  io.on("connection", (socket) => {
    const client_url = socket.handshake.headers.referer;
    const client_room = client_url?.split("?id=")[1];
    if (!client_room) return;
    socket.join(client_room);

    io.to(socket.id).emit("connected_users", users[client_room]);
    io.to(socket.id).emit("connected_id", socket.id);

    socket.on("join", (user: { name: string }) => {
      if (!users[client_room]) {
        users[client_room] = [];
      }
      if (users[client_room].find((user: any) => user.id === socket.id)) {
        users[client_room] = users[client_room].filter(
          (user: { id: string }) => user.id !== socket.id
        );
      }
      users[client_room].push({ ...user, id: socket.id });
      io.to(client_room)
        .except(socket.id)
        .emit("connected_users", users[client_room]);
    });
    socket.on("kick", (id: string) => {
      io.to(id).emit("kicked");
      users[client_room] = users[client_room].filter(
        (user: { id: string }) => user.id !== id
      );
      io.to(client_room)
        .except(socket.id)
        .emit("connected_users", users[client_room]);
    });
    socket.on("promote", (id: string) => {
      io.to(id).emit("promoted");
      users[client_room] = users[client_room].map((user: { id: string }) => {
        if (user.id === id) {
          return { ...user, role: "adm" };
        }
        return { ...user, role: "player" };
      });
      io.to(client_room)
        .except(socket.id)
        .emit("connected_users", users[client_room]);
    });

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
      if (!users[client_room]) return;
      users[client_room] = users[client_room].filter(
        (user: { id: string }) => user.id !== socket.id
      );
      io.to(client_room).emit("connected_users", users[client_room]);
    });
  });
  res.end();
};

export default SocketHandler;
