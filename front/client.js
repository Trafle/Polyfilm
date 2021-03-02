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
      }
      break;

    case 'iceCandidate':
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

  function getMicrophoneStream(callback) {
    const offerOptions = { mandatory: { OfferToReceiveAudio: true } };
    navigator.mediaDevices.getUserMedia(microphoneOptions)
      .then(micStream => {
        console.log('s');
        micAudioStream = micStream;
        const micTrack = micStream.getTracks()[0];
        micTrack.myOwnTrack = true;
        peers.participants.forEach(p => {
          p.addTrack(micTrack, micStream);
          sendOffer(p.userName, offerOptions, 'microphone');
        });
        callback();
      })
      .catch(logError);
  }
}

function turnOffMic() {
  micAudioStream.getTracks()[0].enabled = false;
  switchMicButtonView();
}

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

function sendOffer(peerName, offerOptions, msid) {
  const localPC = getOrCreatePeer(peerName);
  localPC.createOffer(desc => {
    localPC.setLocalDescription(desc);
    console.log(msid);
    if (msid) desc.msid = msid;
    send({ type: 'sdp', to: peerName, sdp: desc });
  }, logError, offerOptions);
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
      if (t.myOwnTrack) t.enabled = true;
    });
    switchShareButton();

    // const tracksInVidElem = video.srcObject.getTracks() || null;
    // let videoTrack;
    // tracksInVidElem.forEach(track => {
    //   if (track.kind === 'video') videoTrack = track;
    // });
    // if (videoTrack) {
    //   if (videoTrack.myOwnVideo) {
    //     videoTrack.enabled = true;
    //     switchShareButton(false);
    //     return;
    //   } else {
    //     // The case for a client watching the video
    //     return;
    //   }
    // }
  } else {
    navigator.mediaDevices.getDisplayMedia(videoOptions)
      .then(sendTracksToPeers)
      .catch(logError);
    switchShareButton();
  }
}

function sendTracksToPeers(stream) {
  stream.getTracks().forEach(track => {
    peers.participants.forEach(p => p.addTrack(track, stream));
  });
  setVideoElementSource(stream);
  const offerOptions = {
    mandatory:
      { OfferToReceiveVideo: true, OfferToReceiveAudio: true }
  };
  peers.participants.forEach(p => sendOffer(p.userName, offerOptions));
}

function setVideoElementSource(stream) {
  videoStream = stream;
  const videoTracks = videoStream.getTracks();
  videoTracks.forEach(track => {
    track.myOwnTrack = true;
    if (track.kind === 'video') track.myOwnVideo = true;
    else if (track.kind === 'audio') track.myOwnAudio = true;
  });
  // Add tracks to the existing stream object or create a new one
  if (video.srcObject) {
    video.srcObject.addTrack(track, videoStream);
  } else {
    video.srcObject = videoStream;
  }
}

function switchShareButton() {
  if (button.on) {
    button.innerText = 'Share';
    button.onclick = startVideoStream;
    button.on = false;
  } else {
    button.innerText = 'Stop sharing';
    button.onclick = stopSharing;
    button.on = true;
  }
}

// if (micBt.on) {
//   micBt.innerText = 'Mic (off)';
//   micBt.onclick = turnOnMic;
//   micBt.on = false;
// } else {
//   micBt.innerText = 'Mic (on)';
//   micBt.onclick = turnOffMic;
//   micBt.on = true;

function stopSharing() {
  video.srcObject.getTracks().forEach(t => {
    if (t.myOwnTrack) t.enabled = false;
  });
  switchShareButton();
}

function addStreamSource(event) {
  console.log('ADDING STREAM SOURCE');
  console.log(event);
  if (video.srcObject) {
    video.srcObject.addTrack(event.track);
  } else {
    video.srcObject = new MediaStream([event.track]);
  }
  video.play();
}

function getOrCreatePeer(name) {
  let localPC = peers.getParticipant(name);
  if (!localPC) {
    localPC = new RTCPeerConnection(iceServers);
    localPC.userName = name;
    localPC.ontrack = addStreamSource;
    localPC.onicecandidate = ev => onCandidate(name, ev);
    if (micAudioStream)
      localPC.addTrack(micAudioStream.getTracks()[0], micAudioStream);
    if (videoStream)
      videoStream.getTracks().forEach(track => {
        console.log('track being added:', track);
        localPC.addTrack(track, videoStream);
      });
    peers.addParticipant(localPC);
  }
  return localPC;
}

// BLOCK CLIENTS' BUTTONS IF SOMEONE IS ALREADY SHARING