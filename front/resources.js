/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use strict';

const userName = Math.random().toString(36).substring(7);
const room = 'default';
const socket = new WebSocket('wss://77.47.218.54:80');
const peers = new Room('userName', 'connections');
let videoStream; // Variable only true when sharing video
let micAudioStream;

const video = document.getElementById('video');
const audio = document.getElementById('microphones');
const shareBt = document.getElementById('shareBt');
const micBt = document.getElementById('micBt');
const muteBt = document.getElementById('muteBt');
shareBt.on = false;
micBt.on = false;
muteBt.on = true;

const microphoneOptions = {
  video: false,
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  }
};

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

const videoOptions = {
  video: {
    cursor: 'never',
    frameRate: {
      ideal: 30,
      max: 60
    }
  },
  audio: true
};

const audioOfferOption = { mandatory: { OfferToReceiveAudio: true } };
const videoOfferOption = {
  mandatory:
    { OfferToReceiveVideo: true, OfferToReceiveAudio: true }
};

function switchMicButtonView() {
  if (micBt.on) {
    micBt.innerText = 'Mic (off)';
    micBt.onclick = turnOnMic;
    micBt.on = false;
  } else {
    micBt.innerText = 'Mic (on)';
    micBt.onclick = turnOffMic;
    micBt.on = true;
  }
}

function switchShareButton() {
  if (shareBt.on) {
    shareBt.innerText = 'Share';
    shareBt.onclick = startVideoStream;
    shareBt.on = false;
  } else {
    shareBt.innerText = 'Stop sharing';
    shareBt.onclick = stopSharing;
    shareBt.on = true;
  }
}

function addTrackOrInitObject(element, track, stream) {
  if (element.srcObject) {
    element.srcObject.addTrack(track, stream);
  } else {
    element.srcObject = new MediaStream([track]);
  }
}

function unmute() {
  audio.play();
  video.play();
  switchMuteButton();
}

function mute() {
  audio.pause();
  video.pause();
  switchMuteButton();
}

function switchMuteButton() {
  if (muteBt.on) {
    muteBt.innerText = 'Mute';
    muteBt.onclick = mute;
    muteBt.on = false;
  } else {
    muteBt.innerText = 'Unmute';
    muteBt.onclick = unmute;
    muteBt.on = true;
  }
}

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