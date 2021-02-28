'use strict';

const fs = require('fs');
const config = {};

config.host = '77.47.218.54';
config.port = 80;

config.options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

// config.host = '0.0.0.0';
// config.port = 80;

module.exports = config;