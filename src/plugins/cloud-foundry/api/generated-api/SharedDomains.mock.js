(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.SharedDomains = {

    FilterSharedDomainsByName: function () {
      return {
        url: '/api/cf/v2/shared_domains',

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
                    "guid": "97b5b602-0d2a-46f4-98e0-408f6463cbbd",
                    "url": "/v2/shared_domains/97b5b602-0d2a-46f4-98e0-408f6463cbbd",
                    "created_at": "2016-02-19T02:04:07Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "shared-domain.com",
                    "router_group_guid": "my-random-guid",
                    "router_group_types": [
                      "tcp"
                    ]
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
    },

    ListAllSharedDomains: function () {
      return {
        url: '/api/cf/v2/shared_domains',

        response: {

          200: {

            body: {
              "total_results": 2,
              "total_pages": 1,
              "prev_url": null,
              "next_url": null,
              "resources": [
                {
                  "metadata": {
                    "guid": "e05c91d8-e0d1-439a-911f-2216e62dafa6",
                    "url": "/v2/shared_domains/e05c91d8-e0d1-439a-911f-2216e62dafa6",
                    "created_at": "2016-04-12T22:02:34Z",
                    "updated_at": "2016-04-18T19:55:58Z"
                  },
                  "entity": {
                    "name": "stackato-8hhk.local"
                  }
                },
                {
                  "metadata": {
                    "guid": "98dcbe2a-f14f-4dc8-bb33-ccec7ca736df",
                    "url": "/v2/shared_domains/98dcbe2a-f14f-4dc8-bb33-ccec7ca736df",
                    "created_at": "2016-04-20T20:33:26Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "example.org"
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
    },

    RetrieveSharedDomain: function (guid) {
      /* eslint-disable */
      var mock_shared_domains_data = {
        "e05c91d8-e0d1-439a-911f-2216e62dafa6": {
          "entity": {
            "name": "stackato-8hhk.local"
          },
          "metadata": {
            "updated_at": "2016-04-18T19:55:58Z",
            "created_at": "2016-04-12T22:02:34Z",
            "url": "/v2/shared_domains/e05c91d8-e0d1-439a-911f-2216e62dafa6",
            "guid": "e05c91d8-e0d1-439a-911f-2216e62dafa6"
          }
        },
        "98dcbe2a-f14f-4dc8-bb33-ccec7ca736df": {
          "entity": {
            "name": "example.org"
          },
          "metadata": {
            "updated_at": null,
            "created_at": "2016-04-20T20:33:26Z",
            "url": "/v2/shared_domains/98dcbe2a-f14f-4dc8-bb33-ccec7ca736df",
            "guid": "98dcbe2a-f14f-4dc8-bb33-ccec7ca736df"
          }
        }
      };
      /* eslint-enable */

      return {
        url: '/api/cf/v2/shared_domains/' + guid + '',

        response: {

          200: {
            body: mock_shared_domains_data[guid] || {}
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
