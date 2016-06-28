(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.ServiceInstances = {

    CreateServiceInstance: function (newInstanceSpec) {
      return {
        url: '/pp/v1/proxy/v2/service_instances',
        response: {
          200: {
            body: {
              guid: {
                "metadata": {
                  "guid": "8efda023-ccd8-4cbb-b854-d56d7282fec3",
                  "url": "/v2/service_instances/8efda023-ccd8-4cbb-b854-d56d7282fec3",
                  "created_at": "2016-05-12T00:45:07Z",
                  "updated_at": null
                },
                "entity": {
                  "name": newInstanceSpec.name,
                  "credentials": {},
                  "service_plan_guid": newInstanceSpec.service_plan_guid,
                  "space_guid": newInstanceSpec.space_guid,
                  "gateway_data": null,
                  "dashboard_url": null,
                  "type": "managed_service_instance",
                  "last_operation": {
                    "type": "create",
                    "state": "in progress",
                    "description": "",
                    "updated_at": null,
                    "created_at": "2016-05-12T00:45:07Z"
                  },
                  "tags": [
                    "accounting",
                    "mongodb"
                  ],
                  "space_url": "/v2/spaces/" + newInstanceSpec.space_guid,
                  "service_plan_url": "/v2/service_plans/" + newInstanceSpec.service_plan_guid,
                  "service_bindings_url": "/v2/service_instances/8efda023-ccd8-4cbb-b854-d56d7282fec3/service_bindings",
                  "service_keys_url": "/v2/service_instances/8efda023-ccd8-4cbb-b854-d56d7282fec3/service_keys",
                  "routes_url": "/v2/service_instances/8efda023-ccd8-4cbb-b854-d56d7282fec3/routes"
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

    ListAllServiceInstances: function () {
      return {
        url: '/pp/v1/proxy/v2/service_instances',
        response: {
          200: {
            body: {
              guid: {
                "total_results": 1,
                "total_pages": 1,
                "prev_url": null,
                "next_url": null,
                "resources": [
                  {
                    "metadata": {
                      "guid": "b6e8fcbf-5b91-4850-ad4b-00b96e38c6d0",
                      "url": "/v2/service_instances/b6e8fcbf-5b91-4850-ad4b-00b96e38c6d0",
                      "created_at": "2016-05-12T00:45:07Z",
                      "updated_at": null
                    },
                    "entity": {
                      "name": "name-178",
                      "credentials": {
                        "creds-key-2": "creds-val-2"
                      },
                      "service_plan_guid": "9346c902-124e-4c35-9f6c-bfa4848887e5",
                      "space_guid": "de83d7e1-1894-49ce-940f-dea4bc484eac",
                      "gateway_data": null,
                      "dashboard_url": null,
                      "type": "managed_service_instance",
                      "last_operation": {
                        "type": "create",
                        "state": "succeeded",
                        "description": "service broker-provided description",
                        "updated_at": "2016-05-12T00:45:07Z",
                        "created_at": "2016-05-12T00:45:07Z"
                      },
                      "tags": [
                        "accounting",
                        "mongodb"
                      ],
                      "space_url": "/v2/spaces/de83d7e1-1894-49ce-940f-dea4bc484eac",
                      "service_plan_url": "/v2/service_plans/9346c902-124e-4c35-9f6c-bfa4848887e5",
                      "service_bindings_url": "/v2/service_instances/b6e8fcbf-5b91-4850-ad4b-00b96e38c6d0/service_bindings",
                      "service_keys_url": "/v2/service_instances/b6e8fcbf-5b91-4850-ad4b-00b96e38c6d0/service_keys",
                      "routes_url": "/v2/service_instances/b6e8fcbf-5b91-4850-ad4b-00b96e38c6d0/routes"
                    }
                  }
                ]
              }
            }
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
