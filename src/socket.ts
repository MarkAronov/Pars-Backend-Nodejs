import type { Server } from "socket.io";

export const socketHandler = (io: Server) => {
	io.on("connection", (socket) => {
		socket.on("disconnect", () => {});
	});
};
