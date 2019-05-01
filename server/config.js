require('dotenv').config();
const pkg = require('../package.json');
const env = process.env;

const dev = env.NODE_ENV !== 'production';

const get = (name, fallback, options = {}) => {
  if (process.env[name]) {
    return process.env[name];
  }

  if (fallback !== undefined && (dev || !options.requireInProduction)) {
    return fallback;
  }

  throw new Error('Missing env var ' + name);
};

let config = {
  name: pkg.name,
  version: pkg.version,

  logLevel: get('LOG_LEVEL', 'trace'),

  dev: dev,
  buildDate: env.BUILD_DATE,
  commitId: env.COMMIT_ID,
  buildTag: env.BUILD_TAG,

  port: get('PORT', 3000),

  service: {
    uri: get('SERVICE_URI', 'https://ukecc-int-pre.azure.defra.cloud'),
    username: get('SERVICE_USERNAME', undefined, { requireInProduction: true }),
    password: get('SERVICE_PASSWORD', undefined, { requireInProduction: true }),

    awsAccessKeyId: get('AWS_ACCESS_KEY_ID', undefined, { requireInProduction: true }),
    awsSecretAccessKey: get('AWS_SECRET_ACCESS_KEY', undefined, { requireInProduction: true }),
    awsBucketName: get('AWS_BUCKET_NAME', 'mmo-check-my-certificate'),
    awsBucketRegion: get('AWS_BUCKET_REGION', 'eu-west-1'),

    columns: get('CSV_EXTRACT_COLUMNS', 'Timestamp,Document number').split(','),

    ecertType: get('ECERT_TYPE', 'ECERT'),
  }
};

module.exports = config;
