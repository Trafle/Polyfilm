'use strict';

const config = require('./configs');
const logic = require('./back/logic');
const server = require('http').createServer(handler);
const WebSocket = require('ws');
const wsServer = new WebSocket.Server({ server });

wsServer.on('connection', logic.connectionHandler);
wsServer.on('close', logic.closeHandler);

server.listen(config.port, config.host);

function handler(req, res) {
  const nodeStatic = require('node-static');
  const fileSerer = new nodeStatic.Server('./front');
  fileSerer.serve(req, res);
}
