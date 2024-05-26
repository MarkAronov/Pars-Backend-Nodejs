#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from './app.js';
import * as http from 'http';
import * as socketio from 'socket.io';
import IP from 'ip';
import { normalizePort } from './utils/utils.js';

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env['PORT'] || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server: http.Server = http.createServer(app);
const io: socketio.Server = new socketio.Server();
io.attach(server);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);

/**
 * Event listener for HTTP server "error" event.
 */
server.on('error', (error: { syscall: string; code: string }) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
});

/**
 * Event listener for HTTP server "listening" event.
 */
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
  console.log('Listening on ' + bind + ' On IP ' + IP.address());
});
