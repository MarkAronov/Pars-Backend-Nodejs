const express = require('express');
const path = require('path');
const logger = require('morgan');
const cors = require('cors')

const indexRouter = require('./routes/indexRoute');
const usersRouter = require('./routes/usersRoute');
const postsRouter = require('./routes/postsRoute');

const app = express()

app.use(cors())

//Set up mongoose connection
const mongoose = require('mongoose');
const mongoDB = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(indexRouter);
app.use(usersRouter);
app.use(postsRouter);

module.exports = app;
