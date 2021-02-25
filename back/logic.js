'use strict';

const House = require('../front/House');
const sockets = new House('userName');

const connectionHandler = ws => {

  ws.on('message', message => {
    message = parse(message);
    switch (message.type) {

      case 'connection': socketConnectionHandler(ws, message); break;
      case 'sdp': sdpRequestHandler(ws.userName, message); break;

      default: console.log(message);
    }
  });

  ws.on('close', () => sockets.deleteParticipant(ws.userName));
};

function socketConnectionHandler(ws, message) {
  // Check if there is such a connection already
  ws.userName = message.from;
  console.log('ws.userName');
  console.log(ws.userName);
  if (sockets.checkIfPresent(ws.userName)) {
    console.log('connection with this name already present');
    return;
  }
  sockets.addParticipant(ws, message.room);
  console.log('New connection saved with the name:', message.from);

  // If there is more than one connection in the room, introduce them
  const roomIndex = sockets.getRoomIndexByName(message.room);
  if (sockets.rooms[roomIndex].participantCount() < 2) return;
  const noPeerParticipants = sockets.rooms[roomIndex]
    .getAllWithProperty('hasPeerConnection', undefined);

  noPeerParticipants.forEach(p => {
    const potentialPeers = sockets.getAllInRoomExcept(p.userName);
    potentialPeers.forEach(pp => {
      send({ type: 'new-potential-peer', peerName: p.userName }, pp);
    });
  });

}

function sdpRequestHandler(wsName, message) {
  sockets.getParticipantByID(message.from).hasPeerConnection = true;
  sockets.getParticipantByID(message.to).hasPeerConnection = true;
  const receiverPeer = sockets.getParticipantByID(message.to);
  if (receiverPeer) send(message, receiverPeer);
  // if (message.sdp.type === 'offer') {
  //   const receiverPeer = sockets.getParticipantByID(message.to);
  //   if (receiverPeer) send(message, receiverPeer);
  // } else if (message.sdp.type === 'answer') {
  //   const receiverPeer = sockets.getParticipantByID(message.to);
  //   if (receiverPeer) send(message, receiverPeer);
  // }
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