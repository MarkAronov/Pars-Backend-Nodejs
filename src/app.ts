import express from 'express';
import path from 'path';
import cors from 'cors';
import logger from 'morgan';
import expressStatusMonitor from 'express-status-monitor';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connect } from './database/mongoose.js';

import { errorHandlerMiddleware } from './middleware/index.js';

import {
  usersRoutes,
  postsRoutes,
  topicRoutes,
  threadRoutes,
  miscRoutes,
} from './routes/index.js';

import { dirName } from './utils/index.js';

dotenv.config({
  path: path.join(
    `${process.cwd()}/config/`,
    `.env${process.env['NODE_ENV'] === 'test' ? '.test' : '.dev'}`,
  ),
});

const app = express();

connect();

app.use(helmet());
app.use(expressStatusMonitor());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(dirName(), 'public')));

app.use(usersRoutes, topicRoutes, threadRoutes, postsRoutes, miscRoutes);

app.use(errorHandlerMiddleware);

console.clear();
export default app;
