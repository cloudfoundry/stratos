(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.UserServiceInstanceApi = mock.UserServiceInstanceApi || {};

  mock.UserServiceInstanceApi = {

    list: function (cnsiGuid) {
      return {
        url: '/pp/v1/cnsis/registered',

        response: {
          200: {
            body: [
              {
                "guid": cnsiGuid,
                "name": "Julbra HCF",
                "cnsi_type": "hcf",
                "api_endpoint": {
                  "Scheme": "https",
                  "Opaque": "",
                  "User": null,
                  "Host": "api.hcf.julbra.stacktest.io",
                  "Path": "/",
                  "RawPath": "",
                  "RawQuery": "",
                  "Fragment": ""
                },
                "account": "c865933c-72c9-456f-b0de-bc35696b8325",
                "token_expiry": 1477052525,
                "skip_ssl_validation": true
              }]
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
