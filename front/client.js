'use strict';

const socket = new WebSocket('ws://localhost:9000');
const room = 'default';
const video = document.getElementById('video');
const peers = new Room('userName', 'connections');
var videoStream;
const userName = Math.random().toString(36).substring(7);
var micIsOn = false;


socket.onopen = e => {
  console.log('Server connection open');
  send({ type: 'connection', room });
};

socket.onmessage = event => {
  const data = parse(event.data);
  switch (data.type) {

    case 'new-potential-peer': sendOffer(data); break;

    case 'sdp':
      console.log(data);

      if (data.sdp.type === 'offer') {
        const localPC = new RTCPeerConnection();
        localPC.ontrack = addStreamSource;
        localPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
        sendAnswer(localPC, data);

      } else if (data.sdp.type === 'answer') {
        const localPC = peers.getParticipant(data.from);
        const description = new RTCSessionDescription(data.sdp);
        localPC.setRemoteDescription(description);
      }
      break;

    case 'iceCandidate':
      peers.getParticipant(data.from)
        .addIceCandidate(new RTCIceCandidate(data.candidate)
          .then().catch());
      break;

    default:
  }

};

function sendOffer(data) {
  const localPC = new RTCPeerConnection();
  localPC.createOffer(desc => localDescCreated(desc, data.peerName), logError)
    .then(desc => {
      localPC.setLocalDescription(desc);
      localPC.userName = data.peerName;
      peers.addParticipant(localPC);
    })
    .catch(logError);
}

function sendAnswer(localPC, data) {
  localPC.createAnswer().then(desc => {
    localPC.setLocalDescription(desc);
    localPC.userName = data.from;
    peers.addParticipant(localPC);
    send({ type: 'sdp', to: data.from, sdp: desc });
  });
}

function switchMic() {
  micIsOn === true ? turnMicOn() : turnMicOff();
}

function turnMicOn() { }

function turnMicOff() { }

function localDescCreated(description, to) {
  console.log('setting local desc');
  console.log({ type: 'sdp', to, sdp: description });
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
    .then(gotLocalMediaStream)
    .catch(logError);
}

function gotLocalMediaStream(stream) {
  videoStream = stream;
  stream.getTracks().forEach(track => {
    peers.participants.forEach(p => p.addTrack(track, stream));
  });
  video.srcObject = stream;
  video.play();
  // Send another offer to all participants in the room
  // to join the stream
}

function addStreamSource(event) {
  console.log('adding stream source');
  console.log(event);
  console.log(event.streams[0]);
  video.srcObject = event.streams[0];
}

function parse(obj) {
  return JSON.parse(obj);
}

function send(msg) {
  msg.from = userName;
  socket.send(JSON.stringify(msg));
}