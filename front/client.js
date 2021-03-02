/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
'use strict';

socket.onopen = () => {
  send({ type: 'connection', room });
};

socket.onmessage = event => {
  const data = parse(event.data);
  console.log(data.type);
  switch (data.type) {

    case 'new-potential-peer': newPotentialPeerHandler(data.peerName); break;

    case 'sdp':
      console.log(data.sdp);
      if (data.sdp.type === 'offer') {
        // console.log('offer');
        // console.log(data);
        const localPC = getOrCreatePeer(data.from);
        const d = new RTCSessionDescription(data.sdp);
        console.log(d);
        localPC.setRemoteDescription(d);
        sendAnswer(localPC.userName, data);

      } else if (data.sdp.type === 'answer') {
        // console.log('answer');
        // console.log(data);
        const localPC = getOrCreatePeer(data.from);
        const description = new RTCSessionDescription(data.sdp);
        console.log(description);
        localPC.setRemoteDescription(description);
        connectPeerToStreams(localPC.userName);
      }
      break;

    case 'iceCandidate':
      console.log('ice');
      peers.getParticipant(data.from)
        .addIceCandidate(new RTCIceCandidate(data.candidate));
      break;

    case 'peerDisconnected': peerDisconnectedHandler(data); break;

    default:
      console.error('bad server request');
  }
};

function turnOnMic() {
  console.log('MIC SHARING HERE');

  if (micAudioStream) {
    micAudioStream.getTracks()[0].enabled = true;
    switchMicButtonView();
  } else {
    getMicrophoneStream(switchMicButtonView);
  }

}

function getMicrophoneStream(callback) {
  navigator.mediaDevices.getUserMedia(microphoneOptions)
    .then(micStream => {
      micAudioStream = micStream;
      const micTrack = micStream.getTracks()[0];
      peers.participants.forEach(p => {
        p.addTrack(micTrack, micStream);
        sendOffer(p.userName, audioOfferOption, 'microphonetrack');
      });
      callback();
    })
    .catch(logError);
}

function replacePartOfString(string, substr) {
  for (let i = 0; i < substr.length; i++) {
    string[i] = substr[i];
  }
  return string;
}

function turnOffMic() {
  micAudioStream.getTracks()[0].enabled = false;
  switchMicButtonView();
}

function newPotentialPeerHandler(name) {
  sendOffer(name);
}

function peerDisconnectedHandler(data) {
  const remoteSDP = peers.getParticipant(data.peerName).remoteDescription.sdp;
  const sendVideoRegexp = /.*m=video[\s\S]*a=send/;
  // If the participant was the one streaming
  if (sendVideoRegexp.test(remoteSDP)) clearVideoSource();
  peers.deleteParticipant(data.peerName);
}

function clearVideoSource() {
  video.srcObject = undefined;
}

function onCandidate(to, ev) {
  if (ev.candidate)
    send({ type: 'iceCandidate', candidate: ev.candidate, to });
}

function sendOffer(peerName, offerOptions, customInfo) {
  const localPC = getOrCreatePeer(peerName);
  localPC.createOffer(desc => {
    if (customInfo) desc.sdp = addCustomLabelToSdp(desc.sdp, customInfo);
    localPC.setLocalDescription(desc);
    console.log(desc);
    send({ type: 'sdp', to: peerName, sdp: desc });
  }, logError, offerOptions);
}

function addCustomLabelToSdp(sdp, streamType) {
  const lines = sdp.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = line.replace(/(a=extmap:[0-9]+) [^ \n]+/gi,
      '$1 https://www.kevinmoreland.com/webrtc/' + streamType);
    lines[i] = line;
  }
  return lines.join('\n');
}

function sendAnswer(name, data) {
  const localPC = getOrCreatePeer(name);
  localPC.createAnswer().then(desc => {
    localPC.setLocalDescription(desc);
    send({ type: 'sdp', to: data.from, sdp: desc });
  }).catch(logError);
}

socket.onclose = event => {
  console.log('Closed cleanly: ' + event.wasClean);
};

socket.onerror = error => {
  console.log(`[error] ${error.message}`);
};

function startVideoStream() {
  // If the sharing has already been initiated and is just put on pause
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => {
      t.enabled = true;
    });
  } else {
    navigator.mediaDevices.getDisplayMedia(videoOptions)
      .then(sendTracksToPeers)
      .catch(logError);
  }
  switchShareButton();
}

function sendTracksToPeers(stream) {
  stream.getTracks().forEach(track => {
    peers.participants.forEach(p => p.addTrack(track, stream));
  });
  setVideoElementSource(stream);
  peers.participants.forEach(
    p => sendOffer(p.userName, videoOfferOption, 'screensharing'));
}

function setVideoElementSource(stream) {
  videoStream = stream;
  stream.getTracks().forEach(track => {
    addTrackOrInitObject(video, track, stream);
  });
}

function addStreamSource(event) {
  console.log('ADDING STREAM SOURCE');
  const sdp = event.target.remoteDescription.sdp.toString();
  if (sdp.indexOf('microphonetrack') !== -1) {
    addTrackOrInitObject(audio, event.track, event.streams[0]);
  } else if (sdp.indexOf('screensharing') !== -1) {
    videoStream = null;
    video.srcObject = new MediaStream([event.track]);
  }
  video.play();
  audio.play();
}

function stopSharing() {
  video.srcObject.getTracks().forEach(t => {
    t.enabled = false;
  });
  switchShareButton();
}

function getOrCreatePeer(name) {
  let localPC = peers.getParticipant(name);
  if (!localPC) {
    localPC = new RTCPeerConnection(iceServers);
    localPC.userName = name;
    localPC.ontrack = addStreamSource;
    localPC.onicecandidate = ev => onCandidate(name, ev);
    peers.addParticipant(localPC);
  }
  return localPC;
}

function connectPeerToStreams(name) {
  const localPC = peers.getParticipant(name);
  if (localPC.connected) return;
  if (micAudioStream) {
    localPC.addTrack(micAudioStream.getTracks()[0], micAudioStream);
    sendOffer(name, audioOfferOption, 'microphonetrack');
  }
  if (videoStream) {
    videoStream.getTracks().forEach(track => {
      console.log('track being added:', track);
      localPC.addTrack(track, videoStream);
      console.log('length of videoStream.getTracks()');
      console.log(videoStream.getTracks().length);
    });
    sendOffer(name, videoOfferOption, 'screensharing');
  }
  localPC.connected = true;
}

// BLOCK CLIENTS' BUTTONS IF SOMEONE IS ALREADY SHARING