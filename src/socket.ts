import type { Server } from "socket.io";

export const socketHandler = (io: Server) => {
	io.on("connection", (socket) => {
		console.log("new connection");

		socket.on("disconnect", () => {
			console.log("connection disconnected");
		});
	});
};
