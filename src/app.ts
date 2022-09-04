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
import errorHandler from './middleware/errorHandler.js';
import jsonParser from './middleware/jsonParser.js';

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

app.use(jsonParser);
app.use(usersRouter);
app.use(postsRouter);
app.use(miscRouter);
app.use(errorHandler);

console.clear();
console.log('Listening');
export default app;
