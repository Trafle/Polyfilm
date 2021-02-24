'use strict';

const socketConnections = new Array();

const connectionHandler = (ws, wsServer) => { // wsServer for broadcasting
  // console.dir(wsServer);
  ws.deleteFromConnections = deleteFromConnections;
  ws.on('message', message => {
    message = parse(message);
    switch (message.type) {

      case 'userName':

        if (getConnectionByName(message.userName)) {
          console.log('Connection with this name already exists: '
            , message.userName);
          break;
        }
        ws.userName = message.userName;
        ws.room = message.room;
        socketConnections.push(ws);
        console.log('New connection saved with the name:', ws.userName,
          '\nconnections total:', socketConnections.length);
        break;

      default: console.log(message);
    }
  });

  ws.on('close', () => ws.deleteFromConnections());

};

function getConnectionByName(name) {
  for (let i = 0; i < socketConnections.length; i++) {
    if (socketConnections[i].userName === name) return socketConnections[i];
  }
  return null;
}

function deleteFromConnections() {
  socketConnections.forEach((c, i) => {
    if (c.userName === this.userName) {
      socketConnections.splice(i, 1);
      console.log('Connection deleted:', this.userName);
    }
  });
}

const closeHandler = () => console.log('some connection closed');

function parse(obj) {
  return JSON.parse(obj);
}

function send(msg, webSocket) {
  webSocket.send(JSON.stringify(msg));
}

module.exports = { connectionHandler, closeHandler };