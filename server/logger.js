const Logger = require('bunyan');
const pkg = require('../package');

module.exports = new Logger({
  name: `${pkg.name}@${pkg.version}`,
  streams: [
    {
      stream: process.stdout,
      level: 'TRACE',
    }
  ]
});
