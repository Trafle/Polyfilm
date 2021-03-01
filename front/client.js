/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
'use strict';

socket.onopen = () => {
  send({ type: 'connection', room });
};

socket.onmessage = event => {
  const data = parse(event.data);
  switch (data.type) {

    case 'new-potential-peer': sendOffer(data.peerName); break;

    case 'sdp':

      if (data.sdp.type === 'offer') {
        console.log('in offer');
        const localPC = getOrCreatePeer(data.from);
        localPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
        sendAnswer(localPC.userName, data);

      } else if (data.sdp.type === 'answer') {
        console.log('in answer');
        const localPC = getOrCreatePeer(data.from);
        const description = new RTCSessionDescription(data.sdp);
        console.log('setting answer as the remote description ');
        console.log(localPC);
        localPC.setRemoteDescription(description)
          .then(logSuccess)
          .catch(logError);
      }
      break;

    case 'iceCandidate':
      console.log('iceCandidate');
      console.log(data.candidate);
      peers.getParticipant(data.from)
        .addIceCandidate(new RTCIceCandidate(data.candidate));
      break;

    default:
      console.error('bad server request');
  }

};

function onCandidate(to, ev) {
  if (ev.candidate)
    send({ type: 'iceCandidate', candidate: ev.candidate, to });
}

function sendOffer(peerName, offerOptions) {
  // if (!offerOptions) offerOptions = undefined;
  console.log(peerName);
  const localPC = getOrCreatePeer(peerName);
  localPC.createOffer(desc => {
    localPC.setLocalDescription(desc);
    send({ type: 'sdp', to: peerName, sdp: desc });
  }, logError, offerOptions);
}

function sendAnswer(name, data) {
  const localPC = getOrCreatePeer(name);
  console.log('creating an answer');
  localPC.createAnswer().then(desc => {
    console.log('setting local description before sending answer');
    localPC.setLocalDescription(desc);
    send({ type: 'sdp', to: data.from, sdp: desc });
  });
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

  // If the sharing has already been initiated and is just put on pause
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.enabled = true);
  } else {
    navigator.mediaDevices.getDisplayMedia(videoOptions)
      .then(addTracksToPeers)
      .catch(logError);
  }
}

function addTracksToPeers(stream) {
  console.log('setting the stream');
  stream.getTracks().forEach(track => {
    peers.participants.forEach(p => p.addTrack(track, stream));
  });
  startSharing(stream);
  const offerOptions = {
    mandatory:
      { OfferToReceiveVideo: true, OfferToReceiveAudio: true }
  };
  peers.participants.forEach(p => sendOffer(p.userName, offerOptions));
}

function startSharing(stream) {
  console.log('start');
  video.srcObject = stream;
  videoStream = stream;
  button.innerText = 'Stop sharing';
  button.onclick = stopSharing;
  videoSharing = false;
}

function stopSharing() {
  console.log('stop');
  button.innerText = 'Share';
  button.onclick = startVideoStream;
  video.srcObject.getTracks().forEach(t => t.enabled = false);
  videoSharing = true;
}

function addStreamSource(event) {
  console.log('ADDING STREAM SOURCE:');
  const mediaStream = new MediaStream([event.track]);
  video.srcObject = mediaStream;
  video.play();
}

function getOrCreatePeer(name) {
  let localPC = peers.getParticipant(name);
  if (!localPC) {
    localPC = new RTCPeerConnection(iceServers);
    localPC.userName = name;
    localPC.ontrack = addStreamSource;
    localPC.onicecandidate = ev => onCandidate(name, ev);
    if (videoStream) {
      videoStream.getTracks().forEach(t => {
        localPC.addTrack(t, videoStream);
      });
    }
    peers.addParticipant(localPC);
  }
  return localPC;
}

function switchMic() {
  micIsOn === true ? turnMicOn() : turnMicOff();
}

function turnMicOn() { }

function turnMicOff() { }