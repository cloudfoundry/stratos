(function () {
  'use strict';

  var noCache = require('connect-nocache')();

  exports.init = init;

  function init(router, config, proxy) {

    router.get('/pp/v1/proxy/v2/config/feature_flags', noCache, function (request, response) {
      return proxy.web(rewriteHeader(request, config), response);
    });

    router.get('/pp/v1/proxy/v2/users/:id/summary', noCache, function (request, response) {
      return proxy.web(rewriteUserSummaryRequest(request, config), response);
    });

  }

  function rewriteHeader(request, config) {
    request.headers['x-cnap-cnsi-list'] = config.hcf.cnsi;
    return request;
  }

  function rewriteUserSummaryRequest(request, config) {
    request = rewriteHeader(request, config);
    request.url = request.url.replace(request.params.id, config.hcf.user_id);
    return request;
  }
})();
