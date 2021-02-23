'use strict';

const staticServer = require('node-static'); // static file server for client
const config = require('./configs');
const app = require('http').createServer(handler);
const io = require('socket.io')(app);
const fs = require('fs');
const ss = require('socket.io-stream');

const fileServer = new (staticServer.Server)('./front');

app.listen(config.port, config.host);

function handler(req, res) {
  fileServer.serve(req, res);
}

io.on('connection', socket => {
  console.log('client connection...');

  socket.on('play', () => {
    const stream = ss.createStream();
    ss(socket).emit('videoStream', stream);
    fs.createReadStream('./front/index.html', {
      encoding: 'base64'
    }).pipe(stream);
  });
});

