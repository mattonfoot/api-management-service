const safely = (fn) => {
  try {
    return fn();
  } catch (ex) {
    // ignore failures
  }
};

const getBuild = () => safely(() => require('../../build-info.json'));
const getVersion = () => safely(() => require('../../package.json').version);

const addAppInfo = (result) =>
  Object.assign({}, result, { uptime: process.uptime(), build: getBuild(), version: getVersion() });

const gatherCheckInfo = (total, x) =>
  Object.assign({}, total, {[ x.name ]: (x => (delete x.name) && x)(x)});

module.exports = function healthcheck() {
  let response = {
    healthy: true,
    status: 'UP',
    checks: {}
  };

  const checks = [
    // Export certificate check
    // s3 bucket check
  ];
  if (!checks.length) return new Promise(res => res(addAppInfo(response)));

  return Promise.all(checks.map(fn => fn()))
      .then(results => {
        response.healthy = results.every(x => x.health || x.healthy || ['OK', 'UP'].indexOf(x.status));
        if (response.healthy) response.status = 'UP';
        response.checks = results.reduce(gatherCheckInfo, {});

        return response;
      })
      .then(addAppInfo);
};
