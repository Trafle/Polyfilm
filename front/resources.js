/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use strict';

const userName = Math.random().toString(36).substring(7);
const room = 'default';
const video = document.getElementById('video');
const micIsOn = false;
const socket = new WebSocket('wss://77.47.218.54:80');
const peers = new Room('userName', 'connections');


const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      url: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    },
    {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      url: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    }
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