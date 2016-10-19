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
