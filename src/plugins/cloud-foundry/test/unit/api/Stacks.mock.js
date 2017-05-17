(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Stacks = {

    ListAllStacks: function () {
      return {
        url: '/pp/v1/proxy/v2/stacks?results-per-page=100',

        response: {
          200: {
            body: {
              'metadata': {
                'guid': '6f4c4eb9-cd2f-4df4-bfc0-4dff5a03f118',
                'url': '/v2/stacks/6f4c4eb9-cd2f-4df4-bfc0-4dff5a03f118',
                'created_at': '2017-05-05T21:21:14Z',
                'updated_at': '2017-05-05T21:21:14Z'
              },
              'entity': {
                'name': 'cflinuxfs2',
                'description': 'Cloud Foundry Linux-based filesystem'
              }
            }
          },

          500: {
            body: {guid: {}}
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})
(this.mock = this.mock || {});
