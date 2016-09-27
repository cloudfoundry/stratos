(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Users = {

    ListAllUsers: function () {
      return {
        url: '/pp/v1/proxy/v2/users',

        response: {
          201: {
            body: {
                "metadata": {
                  "guid": "a9bf1ec7-48f5-49e0-befb-4c3602591325",
                  "url": "/v2/routes/a9bf1ec7-48f5-49e0-befb-4c3602591325",
                  "created_at": "2016-02-19T02:04:02Z",
                  "updated_at": null
                },
                "entity": {
                  "host": "host-25",
                  "path": "",
                  "domain_guid": "b7dafe61-0077-4017-adf1-17433e1926c3",
                  "space_guid": "b3bfcbb3-b786-41c0-b700-108db832e1db",
                  "service_instance_guid": null,
                  "port": 0,
                  "domain_url": "/v2/domains/b7dafe61-0077-4017-adf1-17433e1926c3",
                  "space_url": "/v2/spaces/b3bfcbb3-b786-41c0-b700-108db832e1db",
                  "apps_url": "/v2/routes/a9bf1ec7-48f5-49e0-befb-4c3602591325/apps"
                }
            }
          },

          500: {
            body: {guid: {}}
          }
        }
      };
    }
  }

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
