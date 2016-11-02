(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.hceApi = mock.hceApi || {};

  mock.hceApi.UserProvidedServiceInstancesApi = {

    ListAllServiceBindingsForUserProvidedServiceInstance: function (id) {
      return {
        url: '/pp/v1/proxy/v2/user_provided_service_instances/' + id + '/service_bindings',
        response: {
          200: {
            resources: [{
              metadata: {
                guid: '1'
              }
            }]
          },

          500: {
            body: []
          }
        }
      };
    },
    RetrieveUserProvidedServiceInstance: function (appGuid) {
      return {
        url: '/pp/v1/proxy/v2/user_provided_service_instances/' + appGuid,
        response: {
          200: {
            metadata: {
              guid: '110f191c-51ec-46b0-a617-4c64da10404a',
              url: '/v2/user_provided_service_instances/110f191c-51ec-46b0-a617-4c64da10404a',
              created_at: '2016-10-26T15:35:33Z',
              updated_at: '2016-10-26T15:39:01Z'
            },
            entity: {
              name: 'hce-b5c4b919-43ba-438a-8613-4d1b5451c68d',
              credentials: {
                hce_api_url: 'https://accd6e75392e011e68e0e0653830b7e5-515968244.eu-central-1.elb.amazonaws.com:443/v2',
                hce_execution_id: '10',
                hce_pipeline_id: '16'
              },
              space_guid: '71ce768b-474c-4c5e-9b7f-fa20aaea765c',
              type: 'user_provided_service_instance',
              syslog_drain_url: '',
              route_service_url: '',
              space_url: '/v2/spaces/71ce768b-474c-4c5e-9b7f-fa20aaea765c',
              service_bindings_url: '/v2/user_provided_service_instances/110f191c-51ec-46b0-a617-4c64da10404a/service_bindings',
              routes_url: '/v2/user_provided_service_instances/110f191c-51ec-46b0-a617-4c64da10404a/routes'
            }
          },

          500: {
            body: []
          }
        }
      };
    },
    DeleteUserProvidedServiceInstance: function (id) {
      return {
        url: '/pp/v1/proxy/v2/user_provided_service_instances/' + id,
        response: {
          201: {
            body: {}
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
