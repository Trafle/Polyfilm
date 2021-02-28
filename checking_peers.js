'use strict';

const video1 = document.getElementById('video1');
const video2 = document.getElementById('video2');
let peer1 = new RTCPeerConnection();
let peer2 = new RTCPeerConnection();
let videoStream;

peer1.onicecandidate = ev => {
  console.log('peer1 oncandidate event');
  if (ev.candidate) {
    const c = new RTCIceCandidate(ev.candidate);
    peer2.addIceCandidate(c);
  }
};

peer2.onicecandidate = ev => {
  console.log('peer2 oncandidate event');
  if (ev.candidate) {
    const c = new RTCIceCandidate(ev.candidate);
    peer1.addIceCandidate(c);
  }
};

peer2.ontrack = ev => {
  const video = new MediaStream([ev.track]);
  console.log(video);
  video2.srcObject = video;
};


function startVideoStream() {
  const videoOptions = {
    video: true,
    audio: true
  };

  navigator.mediaDevices.getDisplayMedia(videoOptions)
    .then(gotLocalMediaStream)
    .catch(logError);
}

function gotLocalMediaStream(stream) {
  console.log('setting the stream');
  console.log(stream.getTracks());
  peer1.addTrack(stream.getTracks()[0]);
  videoStream = stream;
  video1.srcObject = stream;
  peer1.createOffer()
    .then(desc => {
      peer1.setLocalDescription(desc);
      peer2.setRemoteDescription(desc);
      peer2.createAnswer()
        .then(des => {
          peer2.setLocalDescription(des);
          peer1.setRemoteDescription(des);
        })
        .catch(logError);
    })
    .catch(logError);
}

function logError(e) {
  console.error(`Bad thing: ${e}`);
}

function logSuccess() {
  console.log('Promise Success!');
}