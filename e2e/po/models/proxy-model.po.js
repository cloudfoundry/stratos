'use strict';

var helpers = require('../helpers.po');

module.exports = {
  fetchCnsi: fetchCnsi,
  fetchRegisteredCnsi: fetchRegisteredCnsi
};

/**
 * @function fetchCnsi
 * @description
 * @param {object?} optionalReq - optional, should have authed session data
 * @param {string?} username -
 * @param {string?} password -
 * @returns {Promise} A promise
 */
function fetchCnsi(optionalReq, username, password) {
  return helpers.createReqAndSession(optionalReq, username, password)
    .then(function (req) {
      return helpers.sendRequest(req, { method: 'GET', url: 'pp/v1/cnsis' });
    });
}

/**
 * @function fetchRegisteredCnsi
 * @description
 * @param {object?} optionalReq - optional, should have authed session data
 * @param {string?} username -
 * @param {string?} password -
 * @returns {Promise} A promise
 */
function fetchRegisteredCnsi(optionalReq, username, password) {
  return helpers.createReqAndSession(optionalReq, username, password)
    .then(function (req) {
      return helpers.sendRequest(req, { method: 'GET', url: 'pp/v1/cnsis/registered'});
    });
}
