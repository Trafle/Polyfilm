'use strict';

const socket = new WebSocket('ws://localhost:9000');
const localPeerConnection = new RTCPeerConnection();
const room = 'default';

const peerConnections = new Array();
const userName = Math.random().toString(36).substring(7);

socket.onopen = e => {
  console.log('connection open');
  send({ type: 'userName', userName, room });
};

socket.onmessage = event => {
  const data = parse(event.data);
  console.log('message from server:', data);

  switch (data.type) {

    case 'peerAnswer':
      const remoteDesc = new RTCSessionDescription(data.answer);
      localPeerConnection.setRemoteDescription(remoteDesc);
      localPeerConnection.createOffer(offer => {
        localPeerConnection.setLocalDescription(offer);
        socket.send({ 'offer': offer });
      });
      break;

    default:
  }

};

socket.onclose = event => {
  console.log('closed cleanly: ' + event.wasClean);
};

socket.onerror = error => {
  console.log(`[error] ${error.message}`);
};

// function connectToRoom(room) {
//   send({ type });
// }


// function onCandidate(candidate) {
//   localPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
// }

function parse(obj) {
  return JSON.parse(obj);
}

function send(msg) {
  socket.send(JSON.stringify(msg));
}

// const video = document.getElementById('video');
// let videoStream;

// const videoOptions = {
//   video: {
//     cursor: 'never'
//   },
//   audio: {
//     echoCancellation: true,
//     noiseSuppression: true,
//     sampleRate: 44100
//   }
// };

// navigator.mediaDevices.getDisplayMedia(videoOptions)
//   .then(getLocalMediaStream)
//   .catch(catchGetMediaStreamError);

// function getLocalMediaStream(stream) {
//   videoStream = stream;
//   video.srcObject = stream;
//   video.play();
// }

// function catchGetMediaStreamError(e) {
//   console.log('error with getDisplayMedia: ', e);
// }



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

// localPeerConnection.addEventListener('iceconnectionstatechange');


// localPeerConnection.addStream(videoStream);
// localPeerConnection.createOffer();



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
//   return (peerConnection === localPeerConnection) ?
//     remotePeerConnection : localPeerConnection;
// }

// // Logs changes to the connection state.
// function handleConnectionChange(event) {
//   const peerConnection = event.target;
//   console.log('ICE state change event: ', event);
//   console.log(`${getPeerName(peerConnection)} ICE state: ` +
//     `${peerConnection.iceConnectionState}.`);
// }

// function getPeerName(peerConnection) {
//   return (peerConnection === localPeerConnection) ?
//     'localPeerConnection' : 'remotePeerConnection';
// }