const Logger = require('bunyan');

const config = require('./config');

module.exports = new Logger({
  name: config.name,
  streams: [
    {
      stream: process.stdout,
      level: config.logLevel,
    }
  ]
});
