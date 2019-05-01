const http = require('http');

const config = require('./server/config');
const logger = require('./server/logger');

const makeApp = require('./app');

makeApp(config, logger, (err, app) => {
  if (err) throw err;

  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info({
      addr: server.address(),
    }, 'Server listening' );
  });
});
