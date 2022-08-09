import express from 'express';
import path from 'path';
import cors from 'cors';
import logger from 'morgan';
import { connect } from './database/mongoose.js';
import { dirName } from './utils/utils.js';

import usersRouter from './routes/usersRoute.js';
import postsRouter from './routes/postsRoute.js';
import miscRouter from './routes/miscRoutes.js';
import expressStatusMonitor from 'express-status-monitor';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config({
  path: path.join(
    `${process.cwd()}/config/`,
    `.env${process.env.NODE_ENV === 'test' ? '.test' : '.dev'}`
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

app.use(usersRouter);
app.use(postsRouter);
app.use(miscRouter);
console.clear();
console.log('Working!');
export default app;
