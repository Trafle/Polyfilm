'use strict';

const House = require('../front/House');
const sockets = new House('userName');

const connectionHandler = ws => {

  ws.on('message', message => {
    message = parse(message);
    switch (message.type) {

      case 'connection': socketConnectionHandler(ws, message); break;
      case 'sdp': case 'iceCandidate': case 'stoppedSharingVideo':
        redirectToUser(message); break;

      default: console.log(message);
    }
  });

  ws.on('close', () => closeConnectionHandler(ws.userName));
};

function closeConnectionHandler(userName) {
  const roomIndex = sockets.getRoomIndexByID(userName);
  sockets.deleteParticipant(userName);
  // Send peerDisconnected to all that remain (if any)
  sockets.rooms[roomIndex].participants.forEach(participant => {
    send({ type: 'peerDisconnected', peerName: userName }, participant);
  });
}

function socketConnectionHandler(ws, message) {
  // Check if there is such a connection already
  ws.userName = message.from;
  if (sockets.checkIfPresent(ws.userName)) {
    console.log('connection with this name already present');
    return;
  }
  sockets.addParticipant(ws, message.room);
  console.log('New connection saved with the name:', message.from);

  // If there is more than one connection in the room, introduce them
  const roomIndex = sockets.getRoomIndexByName(message.room);
  if (sockets.rooms[roomIndex].participantCount() < 2) return;

  // Send potential peer connection signal
  // to everybody who's already in the room
  sockets.rooms[roomIndex].getAllExcept(message.from).forEach(socket => {
    send({ type: 'new-potential-peer', peerName: message.from }, socket);
  });
}

function redirectToUser(message) {
  const receiverPeer = sockets.getParticipantByID(message.to);
  if (receiverPeer) send(message, receiverPeer);
}

function parse(obj) {
  return JSON.parse(obj);
}

function send(msg, webSocket) {
  webSocket.send(JSON.stringify(msg));
}

const closeHandler = () => console.log('some connection closed');

module.exports = { connectionHandler, closeHandler };