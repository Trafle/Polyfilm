/* eslint-disable no-unused-vars */
'use strict';

const userName = Math.random().toString(36).substring(7);
const room = 'default';
const video = document.getElementById('video');
const micIsOn = false;
const socket = new WebSocket('ws://localhost:80');
const peers = new Room('userName', 'connections');


const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

function logError(e) {
  console.error(`Bad thing: ${e}`);
}

function logSuccess(e) {
  console.log('Promise Success!');
}

function parse(obj) {
  return JSON.parse(obj);
}

function send(msg) {
  msg.from = userName;
  socket.send(JSON.stringify(msg));
}