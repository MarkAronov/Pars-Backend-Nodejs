var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/indexRoute');
var usersRouter = require('./routes/userRoute');
var postsRouter = require('./routes/postRoute');

var app = express();


//Set up mongoose connection
const mongoose = require('mongoose');
const mongoDB = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/post', postsRouter);

module.exports = app;
