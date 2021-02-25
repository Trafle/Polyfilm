'use strict';

const socket = new WebSocket('ws://localhost:9000');
const room = 'default';
const video = document.getElementById('video');
const peers = new Room('userName', 'connections');
var videoStream;
const userName = Math.random().toString(36).substring(7);

socket.onopen = e => {
  console.log('Server connection open');
  send({ type: 'connection', room });
};

socket.onmessage = event => {
  const data = parse(event.data);
  switch (data.type) {

    case 'sdp':
      console.log(data);
      if (data.sdp.type === 'offer') {
        // Set the received ICE description
        const localPC = new RTCPeerConnection();
        localPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
        // Formulate answer and send it back to the sender
        localPC.createAnswer().then(desc => {
          localPC.setLocalDescription(desc);
          localPC.userName = data.from;
          peers.addParticipant(localPC);
          send({ type: 'sdp', to: data.from, sdp: desc });
        });
      } else if (data.sdp.type === 'answer') {
        const localPC = peers.getParticipant(data.from);
        const description = new RTCSessionDescription(data.sdp);
        localPC.setRemoteDescription(description);
      }
      break;

    case 'new-potential-peer':
      const localPC = new RTCPeerConnection();
      localPC.createOffer(desc => localDescCreated(desc, data.peerName)
        , logError)
        .then(desc => {
          localPC.setLocalDescription(desc);
          localPC.userName = data.peerName;
          peers.addParticipant(localPC);
        })
        .catch(logError);
      break;

    case 'iceCandidate':
      localPC.addIceCandidate(new RTCIceCandidate(data.candidate)
        .then().catch());
      break;

    default:
  }

};

function localDescCreated(description, to) {
  send({ type: 'sdp', to, sdp: description });
}

function logError(e) {
  console.error(`Bad thing: ${e}`);
}

socket.onclose = event => {
  console.log('Closed cleanly: ' + event.wasClean);
};

socket.onerror = error => {
  console.log(`[error] ${error.message}`);
};

function startVideoStream() {
  const videoOptions = {
    video: {
      cursor: 'never'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }
  };

  navigator.mediaDevices.getDisplayMedia(videoOptions)
    .then(getLocalMediaStream)
    .catch(catchGetMediaStreamError);
}


function getLocalMediaStream(stream) {
  videoStream = stream;
  // localPC.addStream(videoStream);
  stream.getTracks().forEach(track => {
    console.dir('track');
    console.dir(track);
    localPC.addTrack(track, stream);
  });
  video.srcObject = stream;
  video.play();
}

function catchGetMediaStreamError(e) {
  console.log('error with getDisplayMedia: ', e);
}

// function onCandidate(candidate) {
//   localPC.addIceCandidate(new RTCIceCandidate(candidate));
// }

function parse(obj) {
  return JSON.parse(obj);
}

function send(msg) {
  msg.from = userName;
  socket.send(JSON.stringify(msg));
}