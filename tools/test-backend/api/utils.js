/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  exports.getCnsiList = getCnsiList;
  exports.getResultsPerPage = getResultsPerPage;
  exports.clone = clone;
  exports.getCnsiName = getCnsiName;
  exports.getCnsiIdFromHeader = getCnsiIdFromHeader;

  function getCnsiList(request) {
    return request.headers['x-cnap-cnsi-list'].split(',');
  }

  function getResultsPerPage(request) {
    return parseInt(request.query['results-per-page'], 10);
  }

  function clone(object) {
    return JSON.parse(JSON.stringify(object));
  }

  function getCnsiName(cnsiGuid) {
    var id = cnsiGuid.split('hcf')[1];
    return 'mock_hcf_' + id;
  }

  function getCnsiIdFromHeader(request) {

    var cnsiList = request.headers['x-cnap-cnsi-list'];
    var index = cnsiList.indexOf('hcf');
    return parseInt(cnsiList.substr(index + 3, cnsiList.length), 10);
  }
})();
