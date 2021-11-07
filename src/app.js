const express = require('express');
const path = require('path');
const cors = require('cors')
const logger = require('morgan');
require('./database/mongoose')

const usersRouter = require('./routes/usersRoute');
const postsRouter = require('./routes/postsRoute');

const app = express()

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(usersRouter);
app.use(postsRouter);

module.exports = app;
