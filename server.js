const http = require('http');

const logger = require('./server/logger');
const errors = require('./server/errors');

const makeApp = require('./app');

function setupErrorHandling(app, logger) {
  app.use(function notFoundHandler(req, res) {
    const msg = `404: No handler exists for [${req.method}: ${req.originalUrl}]`;

    logger.warn(msg);
    errors.notFound(res, msg);
  });

  // eslint-disable-next-line no-unused-vars
  app.use(function errorHandler(err, req, res, next) {
    logger.error(err);
    errors.unexpected(res, err);
  });
}

makeApp(logger, (err, app) => {
  if (err) throw err;

  const server = http.createServer(app);

  setupErrorHandling(app, logger);

  server.listen(app.locals.config.port, () => {
    logger.info({
      addr: server.address(),
    }, 'Server listening' );
  });
});
