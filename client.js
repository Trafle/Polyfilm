'use strict';

const net = require('net');

const client = new net.Socket();
client.connect(9000, '77.47.218.54', () => {
  console.log('Connected');
  client.write('1');
});

client.on('data', data => {
  console.log('count: ' + data);
  client.write((Number(data.toString()) + 100).toString());
});

client.on('close', () => {
  console.log('Connection closed');
});