const express = require('express');
const router = new express.Router();

const helpers = require('../helpers');
const IndexViewModel = require('../models/base');

// private

const renderIndex = (res) => helpers.format(res, 'index');

const createIndexViewModel = (/* req */) => (/* data */) => new IndexViewModel({});

const displayIndex = (req, res, next) =>
  Promise.resolve({})
    .then(createIndexViewModel(req))
    .then(renderIndex(res))
    .catch(helpers.failWithError(res, next));

module.exports = () => {
  router.get('/', displayIndex);

  return router;
};
