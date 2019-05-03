const path = require('path');

const express = require('express');
const bunyanMiddleware = require('bunyan-middleware');
const expressNunjucks = require('express-nunjucks');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const xFrameOptions = require('x-frame-options');
const acceptFileExtensions = require('accepts-ext');

const moment = require('moment');

const config = require('./config');
const healthcheck = require('./helpers/healthcheck');

const indexController = require('./controllers/index');
const servicesController = require('./controllers/services');

// eslint-disable-next-line no-unused-vars
const formatDate = (str, format) => moment(str).format(format);
const slugify = (str) => str.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()’]/g,"").replace(/ +/g,'_').toLowerCase();
const htmlLog = (nunjucksSafe) => (a) => nunjucksSafe('<script>console.log(' + JSON.stringify(a, null, '\t') + ');</script>');
const isObject = (x) => x != null && typeof x === 'object' && Array.isArray(x) === false;
const isArray = (x) => Array.isArray(x);

function setupBaseMiddleware(app, log) {
  app.use(bunyanMiddleware({
    logger: log,
    obscureHeaders: ['Authorization'],
  }));

  app.use(helmet());
  app.use(helmet.noCache());
  app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(xFrameOptions());

  app.use(acceptFileExtensions);
}

function setupOperationalRoutes(app, logger) {
  logger.info('Registering operational routes...');

  logger.info('GET: /health');
  app.get('/health', (req, res) =>
    healthcheck(app.locals.config, req.log)
      .then((result) => {
        if (!result.healthy) {
          res.status(500);
        }

        res.json(result);
      }));
}

function setupViewEngine (app) {
  let config = app.locals.config;

  app.set('view engine', 'njk');
  app.set('views', [
    path.join(__dirname, '../app/views'),
    path.join(__dirname, '../node_modules/govuk-frontend'),
  ]);

  var nunjucks = expressNunjucks(app, {
      autoescape: true,
      watch: config.dev
  });

  nunjucks.env.addFilter('slugify', slugify);
  nunjucks.env.addFilter('formatDate', formatDate);
  nunjucks.env.addFilter('log', htmlLog(nunjucks.env.getFilter('safe')));
  nunjucks.env.addFilter('isObject', isObject);
  nunjucks.env.addFilter('isArray', isArray);

  return app;
}

function setupStaticRoutes (app, logger) {
  logger.info('Registering static routes...');

  app.use(favicon(path.join(__dirname, '../node_modules/govuk-frontend/assets/images/favicon.ico')));
  app.use('/public', express.static(path.join(__dirname, '../public')));

  app.use('/assets', express.static(path.join(__dirname, '../node_modules/govuk-frontend/assets')));

  // send assetPath to all views
  app.use(function (req, res, next) {
    res.locals.asset_path = "/public/";
    next();
  });

  return app;
}

function setupRouters(app, logger) {
  logger.info('registering controllers...');

  logger.info('/');
  app.use('/', indexController(logger));

  logger.info('/services');
  app.use('/services', servicesController(logger));
};

module.exports = (logger, callback) => {
  const app = express();
  app.locals.config = config;

  app.set('json spaces', 2);
  app.set('trust proxy', true);

  setupBaseMiddleware(app, logger);
  setupOperationalRoutes(app, logger);
  setupViewEngine(app, logger);
  setupStaticRoutes(app, logger);
  setupRouters(app, logger);

  healthcheck(config, logger)
    .then((result) => {
      if (!result.healthy) {
        return logger.error(result);
      }

      logger.info(result);
    });

  return callback(null, app);
};
