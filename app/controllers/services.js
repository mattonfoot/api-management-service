const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');

const express = require('express');
const router = new express.Router();

const git = require('simple-git/promise');
const moment = require('moment');

const helpers = require('../helpers');
const config = require('../config');
const AcknowledgementViewModel = require('../models/base');

// private

const docroot = path.join(process.cwd(), `../${config.docroot}`);
const serviceRegisterPath = path.join(docroot, './index.json');
const remote = config.pkg.repository.url;

if (!fs.existsSync(docroot)) {
  mkdirp.sync(docroot);
}

const repo = git(docroot);

const renderAcknowledgement = (res) => helpers.format(res, 'services/acknowledgement');

const createAcknowledgementViewModel = (/* req */) => (data) => new AcknowledgementViewModel(data);

const convertToRepo = (repo) => {
  return repo.cwd(docroot)
    .then(() => repo.init())
    .then(() => repo.addRemote('origin', remote));
};

const getRepository = (branch) => {
  return repo.cwd(docroot)
    .then(() => repo.checkIsRepo())
    .then(isRepo => !isRepo && convertToRepo(repo))
    .then(() => repo.fetch())
    .then(() => repo.checkout(branch))
    .then(() => repo);
};

const storeServiceConfig = (entry) => (repo) => {
  return new Promise((resolve, reject) => {
    let serviceRegister = [];
    fs.readFile(serviceRegisterPath, (err, data) => {
      if (!err) {
        serviceRegister = [...JSON.parse(data)];
      }

      serviceRegister.push(entry);

      fs.writeFile(serviceRegisterPath, JSON.stringify([...serviceRegister]), (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(repo);
      });
    });
  });
};

const publishChanges = (message) => (repo) => {
  return repo.cwd(docroot)
    .then(() => repo.add('./*'))
    .then(() => repo.commit(message))
    .then(() => repo.push())
    .then(() => repo);
};

const addServiceToRegister = () => async (info) => {
  info = {
    uri: info.uri,
    timestamp: moment().toISOString(true),
  };

  await getRepository('gh-pages')
    .then(storeServiceConfig(info))
    .then(publishChanges('Service registered by webhook'));

  return info;
};

const registerService = (req, res, next) =>
  Promise.resolve(req.body)
    .then(addServiceToRegister(req))
    .then(createAcknowledgementViewModel(req))
    .then(renderAcknowledgement(res))
    .catch(helpers.failWithError(res, next));

module.exports = () => {
  router.post('/', registerService);

  return router;
};
