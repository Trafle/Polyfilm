'use strict';

const fs = require('fs');
const http = require('http');
const path = 'adAstra.mp4';

const requestListener = (req, res) => {
  res.writeHead(200);
  if (req.method === 'GET' && req.url === '/video') {
    const stat = fs.statSync(path);
    const total = stat.size;

    if (req.headers.range) {

      // meaning client (browser) has moved the forward/back slider
      // which has sent this request back to this server logic ... cool

      const range = req.headers.range;
      const parts = range.replace(/bytes=/, '').split('-');
      const partialstart = parts[0];
      const partialend = parts[1];

      const start = parseInt(partialstart, 10);
      const end = partialend ? parseInt(partialend, 10) : total - 1;
      const chunksize = (end - start) + 1;
      console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

      const file = fs.createReadStream(path, { start, end });
      res.writeHead(206, {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
        'Accept-Ranges': 'bytes', 'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      file.pipe(res);

    } else {

      console.log('ALL: ' + total);
      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': 'video/mp4'
      });
      fs.createReadStream(path).pipe(res);
    }

  } else {
    console.log('there');
    res.end('Hello, World!');
  }
};

const host = '77.47.218.54';
const port = 9000;

const server = http.createServer(requestListener);
server.listen(port, host);
