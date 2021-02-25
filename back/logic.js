'use strict';

const House = require('../front/House');
const sockets = new House('userName');

const connectionHandler = ws => {

  ws.on('message', message => {
    message = parse(message);
    switch (message.type) {

      case 'connection': socketConnectionHandler(ws, message); break;
      case 'sdp': broadcastInRoomExcept(ws.userName, message); break;

      default: console.log(message);
    }
  });

  ws.on('close', () => sockets.deleteParticipant(ws.userName));
};

function socketConnectionHandler(ws, message) {
  // Check if there is such a connection already
  if (sockets.checkIfPresent(ws.userName)) {
    console.log('connection with this name already present');
    return;
  }
  ws.userName = message.userName;
  sockets.addParticipant(ws, message.room);
  console.log('New connection saved with the name:', ws.userName);
}

function broadcastInRoomExcept(name, obj) {
  try {
    sockets.getAllInRoomExcept(name).forEach(c => { send(obj, c); });
  } catch (e) {
    console.error('error while trying to broadcast a message in a room\n', e);
  }
}

const closeHandler = () => console.log('some connection closed');

function parse(obj) {
  return JSON.parse(obj);
}

function send(msg, webSocket) {
  webSocket.send(JSON.stringify(msg));
}

module.exports = { connectionHandler, closeHandler };