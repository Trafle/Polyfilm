'use strict';

const socket = io('/');

const video = document.getElementById('video');


socket.emit('play');

socket.on('close', () => {
  console.log('closed connection to server');
});

let binary = new Array();

ss(socket).on('videoStream', stream => {
  console.log('Successful streaming establishment');

  stream.on('data', data => {

    for (let i = 0; i < data.length; i++) {
      binary[i] = atob(data[i]);
    }

    const blob = new Blob(binary, { type: 'video/mp4' });
    const objURL = URL.createObjectURL(blob);
    video.src = objURL;
  });

  stream.on('end', data => {
    console.dir(binary);
    binary = [];
  });
});