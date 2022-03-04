import { dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import path from 'path';
import cors from 'cors';
import logger from 'morgan';
import './database/mongoose.js';

import usersRouter from './routes/usersRoute.js';
import postsRouter from './routes/postsRoute.js';
import miscRouter from './routes/miscRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(usersRouter);
app.use(postsRouter);
app.use(miscRouter);

export default app;
