import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import logger from "morgan";
import { connect } from "./database/mongoose";

import { errorHandlerMiddleware } from "./middleware";

import {
	miscRoutes,
	postRoutes,
	threadsRoutes,
	topicsRoutes,
	usersRoutes,
} from "./routes";

const app = express();

connect();
app.disable("x-powered-by");

app.use(helmet());
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(process.cwd(), "public")));

app.use(usersRoutes, topicsRoutes, threadsRoutes, postRoutes, miscRoutes);

app.use(errorHandlerMiddleware);

export default app;
