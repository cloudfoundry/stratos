(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.ServiceBindings = {

    CreateServiceBinding: function (newBindingSpec) {
      return {
        url: '/pp/v1/proxy/v2/service_bindings',
        response: {
          200: {
            body: {
              guid: {
                "metadata": {
                  "guid": "8ed4029b-251a-41d3-95ee-55cf3a1817d4",
                  "url": "/v2/service_bindings/8ed4029b-251a-41d3-95ee-55cf3a1817d4",
                  "created_at": "2016-05-12T00:45:16Z",
                  "updated_at": null
                },
                "entity": {
                  "app_guid": newBindingSpec.app_guid,
                  "service_instance_guid": newBindingSpec.service_instance_guid,
                  "credentials": {
                    "creds-key-32": "creds-val-32"
                  },
                  "binding_options": {},
                  "gateway_data": null,
                  "gateway_name": "",
                  "syslog_drain_url": null,
                  "volume_mounts": [],
                  "app_url": "/v2/apps/" + newBindingSpec.app_guid,
                  "service_instance_url": "/v2/user_provided_service_instances/" + newBindingSpec.service_instance_guid
                }
              }
            }
          },

          400: {
            body: { guid: {} }
          }
        }
      };
    },

    DeleteServiceBinding: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/service_bindings/' + guid,
        response: {
          200: {
            body: { guid: null }
          },

          204: {
            body: { guid: {} }
          },

          500: {
            body: { guid: { error_code: 1000 } }
          }
        }
      };
    },

    ListAllServiceBindings: function () {
      return {
        url: '/pp/v1/proxy/v2/service_bindings',

        response: {

          200: {

            body: {
              "total_results": 1,
              "total_pages": 1,
              "prev_url": null,
              "next_url": null,
              "resources": [
                {
                  "metadata": {
                    "guid": "571b283b-97f9-41e3-abc7-81792ee34e40",
                    "url": "/v2/service_bindings/571b283b-97f9-41e3-abc7-81792ee34e40",
                    "created_at": "2016-02-19T02:04:08Z",
                    "updated_at": null
                  },
                  "entity": {
                    "app_guid": "6e23689c-2844-4ebf-ab69-e52ab3439f6b",
                    "service_instance_guid": "01430cca-2592-4396-ac79-b1405a488b3e",
                    "credentials": {
                      "creds-key-64": "creds-val-64"
                    },
                    "binding_options": {},
                    "gateway_data": null,
                    "gateway_name": "",
                    "syslog_drain_url": null,
                    "app_url": "/v2/apps/6e23689c-2844-4ebf-ab69-e52ab3439f6b",
                    "service_instance_url": "/v2/service_instances/01430cca-2592-4396-ac79-b1405a488b3e"
                  }
                }
              ]
            }
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
