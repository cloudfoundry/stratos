(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.hceApi = mock.hceApi || {};

  mock.hceApi.HceInfoApi = {

    info: function (guid) {

      var body = {};
      body[guid] = {
        "api_latest_version": 2,
        "api_public_uri": "https://accd6e75392e011e68e0e0653830b7e5-515968244.eu-central-1.elb.amazonaws.com:443/v2",
        "auth_endpoint": "https://hce.identity.julbra.stacktest.io:443"
      };
      return {
        url: '/pp/v1/proxy/info',
        response: {
          200: {
            body: body
          },
          500: {
            body: {}
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
