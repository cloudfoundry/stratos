/* eslint-disable angular/json-functions */

(function () {
  'use strict';

  var helpers = require('../helpers.po');
  var Q = require('../../../tools/node_modules/q');
  var _ = require('../../../tools/node_modules/lodash');

  module.exports = {
    deletePat: deletePat
  };

  function deletePat(patName) {

    var req;

    return helpers.createReqAndSession(null, helpers.getUser(), helpers.getPassword())
      .then(function (inReq) {
        req = inReq;
        // List all PATs
        return helpers.sendRequest(req, {
          method: 'GET',
          url: 'pp/v1/vcs/pat'
        });

      })
      .then(function (response) {
        var patTokens = JSON.parse(response);
        for (var tokenIndex in patTokens) {
          if (!patTokens.hasOwnProperty(tokenIndex)) {
            continue;
          }
          var patToken = patTokens[tokenIndex];

          var name = _.get(patToken, 'token.name', null);
          var guid = _.get(patToken, 'token.guid', null);

          if (name === patName) {

            // Delete named PAT
            return helpers.sendRequest(req, {
              method: 'DELETE',
              url: 'pp/v1/vcs/pat/' + guid
            });
          }
        }

        return Q.resolve();
      });
  }

})();
