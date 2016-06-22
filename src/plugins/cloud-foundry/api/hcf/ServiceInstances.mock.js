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

    ListAllServicePlansForService: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/services/' + guid + '/service_plans',
        response: {
          200: {
            body: {
              guid: {
                total_results: 1,
                total_pages: 1,
                prev_url: null,
                next_url: null,
                resources: [
                  {
                    metadata: {
                      guid: "d22b3754-d093-42a2-a294-5fda6c6db44c",
                      url: "/v2/service_plans/d22b3754-d093-42a2-a294-5fda6c6db44c",
                      created_at: "2016-05-12T00:45:19Z",
                      updated_at: null
                    },
                    entity: {
                      name: "name-1686",
                      free: false,
                      description: "desc-109",
                      service_guid: "67229bc6-8fc9-4fe1-b8bc-8790cdae5334",
                      extra: null,
                      unique_id: "e010ae61-ec46-433d-bdf6-136ead10828b",
                      public: true,
                      active: true,
                      service_url: "/v2/services/67229bc6-8fc9-4fe1-b8bc-8790cdae5334",
                      service_instances_url: "/v2/service_plans/d22b3754-d093-42a2-a294-5fda6c6db44c/service_instances"
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
