'use strict';

const socket = new WebSocket('ws://localhost:9000');
const localPC = new RTCPeerConnection();
const room = 'default';
const video = document.getElementById('video');
var videoStream;


// const peerConnections = new Array();
const userName = Math.random().toString(36).substring(7);

socket.onopen = e => {
  console.log('connection open');
  send({ type: 'userName', userName, room });
};

socket.onmessage = event => {
  const data = parse(event.data);
  switch (data.type) {

    case 'sdp':
      console.log(data);
      localPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if (data.sdp.type === 'offer') {
        localPC.createAnswer().then(desc => {
          localPC.setLocalDescription(desc);
          send({ type: 'sdp', sdp: desc });
        });
      }
      break;

    case 'iceCandidate':
      localPC.addIceCandidate(new RTCIceCandidate(data.candidate)
        .then().catch());
      break;
    default:
  }

};

function connectToRoom(room) {
  localPC.createOffer(localDescCreated, logError)
    .then(desc => localPC.setLocalDescription(desc))
    .catch(logError);
}

function localDescCreated(description) {
  send({ type: 'sdp', sdp: description });
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
  localPC.addStream(videoStream);
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
  socket.send(JSON.stringify(msg));
}







// function handleConnection(event) {
//   const peerConnection = event.target;
//   const iceCandidate = event.candidate;

//   if (iceCandidate) {
//     const newIceCandidate = new RTCIceCandidate(iceCandidate);
//     const otherPeer = getOtherPeer(peerConnection);

//     otherPeer.addIceCandidate(newIceCandidate)
//       .then()
//       .catch();
//   }
// }

// localPC.addEventListener('iceconnectionstatechange');


// localPC.createOffer();



// function handleConnection(event) {
//   console.log('incoming connection');
//   console.dir(event.target);
//   console.dir(event.candidate);
// }

// function handleConnectionSuccess(peerConnection) {
//   console.log(`${getPeerName(peerConnection)} addIceCandidate success.`);
// };

// // Logs that the connection failed.
// function handleConnectionFailure(peerConnection, error) {
//   console.log(`${getPeerName(peerConnection)} failed` +
// ` to add ICE Candidate:\n` +
//     `${error.toString()}.`);
// }

// function handleConnection(event) {
//   const peerConnection = event.target;
//   const iceCandidate = event.candidate;

//   if (iceCandidate) {
//     const newIceCandidate = new RTCIceCandidate(iceCandidate);
//     const otherPeer = getOtherPeer(peerConnection);

//     otherPeer.addIceCandidate(newIceCandidate)
//       .then(() => {
//         handleConnectionSuccess(peerConnection);
//       }).catch(error => {
//         handleConnectionFailure(peerConnection, error);
//       });

//     console.log(`${getPeerName(peerConnection)} ICE candidate:\n` +
//       `${event.candidate.candidate}.`);
//   }
// }

// function getOtherPeer(peerConnection) {
//   return (peerConnection === localPC) ?
//     remotePeerConnection : localPC;
// }

// // Logs changes to the connection state.
// function handleConnectionChange(event) {
//   const peerConnection = event.target;
//   console.log('ICE state change event: ', event);
//   console.log(`${getPeerName(peerConnection)} ICE state: ` +
//     `${peerConnection.iceConnectionState}.`);
// }

// function getPeerName(peerConnection) {
//   return (peerConnection === localPC) ?
//     'localPC' : 'remotePeerConnection';
// }