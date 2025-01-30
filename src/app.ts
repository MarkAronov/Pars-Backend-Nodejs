import path from "node:path";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import logger from "morgan";
import { miscRoutes } from "./api/misc/misc.routes";
import { postRoutes } from "./api/post/post.routes";
import { threadsRoutes } from "./api/thread/thread.routes";
import { topicsRoutes } from "./api/topic/topic.routes";
import { usersRoutes } from "./api/user/user.routes";
import { errorHandlerMiddleware } from "./middleware/errorHandlerMiddleware";
import { dynamicMulter } from "./middleware/multerMiddleware";

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const app = express();

app.disable("x-powered-by");

app.use(limiter);
app.use(helmet());
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(process.cwd(), "public")));
app.use(dynamicMulter);
app.use(usersRoutes, topicsRoutes, threadsRoutes, postRoutes, miscRoutes);

app.use(errorHandlerMiddleware);

export default app;
