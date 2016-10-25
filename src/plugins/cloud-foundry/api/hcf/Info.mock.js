(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Info = {

    GetInfo: function (guid) {

      var body = {};
      body[guid] = {
        "name": "HCF",
        "build": "4.0.0",
        "support": "stackato-support@hpe.com",
        "version": 2,
        "description": "HPE Helion Cloud Foundry",
        "authorization_endpoint": "https://hcf.identity.julbra.stacktest.io:443",
        "token_endpoint": "https://hcf.identity.julbra.stacktest.io:443",
        "min_cli_version": null,
        "min_recommended_cli_version": null,
        "api_version": "2.61.0",
        "app_ssh_endpoint": "ssh.hcf.julbra.stacktest.io:2222",
        "app_ssh_host_key_fingerprint": "a2:16:28:80:23:79:b8:8d:3b:95:c6:a1:b1:be:ed:66",
        "app_ssh_oauth_client": "ssh-proxy",
        "routing_endpoint": "https://api.hcf.julbra.stacktest.io/routing",
        "logging_endpoint": "wss://loggregator.hcf.julbra.stacktest.io:4443",
        "doppler_logging_endpoint": "wss://doppler.hcf.julbra.stacktest.io:4443",
        "user": "bae87025-2aa3-4f89-9d43-b2e9c0932655"
      };
      return {
        url: '/pp/v1/proxy/v2/info',
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
