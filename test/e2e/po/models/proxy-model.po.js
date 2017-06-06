(function () {
  'use strict';

  var helpers = require('../helpers.po');
  var _ = require('lodash');

  module.exports = {
    fetchCnsi: fetchCnsi,
    fetchRegisteredCnsi: fetchRegisteredCnsi,
    fetchCnsiByName: fetchCnsiByName
  };

  function fetchCnsiByName(name) {
    return fetchRegisteredCnsi(null, helpers.getUser(), helpers.getPassword())
      .then(function (response) {
        var cluster = _.find(JSON.parse(response), {name: name});
        return cluster ? cluster.guid : null;
      });
  }

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
        return helpers.sendRequest(req, {method: 'GET', url: 'pp/v1/cnsis'});
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
        return helpers.sendRequest(req, {method: 'GET', url: 'pp/v1/cnsis/registered'});
      });
  }
})();
