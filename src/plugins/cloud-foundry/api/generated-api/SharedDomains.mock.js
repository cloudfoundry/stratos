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
              "total_results": 6,
              "total_pages": 1,
              "prev_url": null,
              "next_url": null,
              "resources": [
                {
                  "metadata": {
                    "guid": "3e087ac4-4972-46f3-8102-f10976db1cd7",
                    "url": "/v2/shared_domains/3e087ac4-4972-46f3-8102-f10976db1cd7",
                    "created_at": "2016-02-19T02:04:06Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "customer-app-domain1.com",
                    "router_group_guid": null
                  }
                },
                {
                  "metadata": {
                    "guid": "74625421-e3e1-4c44-85b0-91db7984a80f",
                    "url": "/v2/shared_domains/74625421-e3e1-4c44-85b0-91db7984a80f",
                    "created_at": "2016-02-19T02:04:06Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "customer-app-domain2.com",
                    "router_group_guid": null
                  }
                },
                {
                  "metadata": {
                    "guid": "8131a72d-ca3d-4e63-8f47-efab777da98d",
                    "url": "/v2/shared_domains/8131a72d-ca3d-4e63-8f47-efab777da98d",
                    "created_at": "2016-02-19T02:04:07Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "domain-63.example.com",
                    "router_group_guid": null
                  }
                },
                {
                  "metadata": {
                    "guid": "06439e4e-bb19-49f7-9965-f3fbb7900aae",
                    "url": "/v2/shared_domains/06439e4e-bb19-49f7-9965-f3fbb7900aae",
                    "created_at": "2016-02-19T02:04:07Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "domain-64.example.com",
                    "router_group_guid": null
                  }
                },
                {
                  "metadata": {
                    "guid": "9bfe303f-026b-405c-861a-f6bda8d5bcc7",
                    "url": "/v2/shared_domains/9bfe303f-026b-405c-861a-f6bda8d5bcc7",
                    "created_at": "2016-02-19T02:04:07Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "domain-65.example.com",
                    "router_group_guid": null
                  }
                },
                {
                  "metadata": {
                    "guid": "ce972938-aab7-41f6-b6b2-2b94d92fe3e6",
                    "url": "/v2/shared_domains/ce972938-aab7-41f6-b6b2-2b94d92fe3e6",
                    "created_at": "2016-02-19T02:04:07Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "domain-66.example.com",
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

    RetrieveSharedDomain: function (guid) {
      return {
        url: '/api/cf/v2/shared_domains/' + guid + '',

        response: {

          200: {

            body: {
              "metadata": {
                "guid": guid,
                "url": "/v2/shared_domains/3e087ac4-4972-46f3-8102-f10976db1cd7",
                "created_at": "2016-02-19T02:04:06Z",
                "updated_at": null
              },
              "entity": {
                "name": "customer-app-domain1.com",
                "router_group_guid": null
              }
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
