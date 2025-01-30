export * from "./app";
export * from "./server";
export * from "./socket";
import { databaseConnect } from "./database/mongoose";

databaseConnect();
