(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.PrivateDomains = {

    FilterPrivateDomainsByName: function () {
      return {
        url: '/api/cf/v2/private_domains',

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
                    "guid": "3de9db5f-8e3b-4d10-a8c9-8137caafe43d",
                    "url": "/v2/private_domains/3de9db5f-8e3b-4d10-a8c9-8137caafe43d",
                    "created_at": "2016-02-19T02:04:00Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "my-domain.com",
                    "owning_organization_guid": "2f70efed-abb2-4b7a-9f31-d4fe4d849932",
                    "owning_organization_url": "/v2/organizations/2f70efed-abb2-4b7a-9f31-d4fe4d849932",
                    "shared_organizations_url": "/v2/private_domains/3de9db5f-8e3b-4d10-a8c9-8137caafe43d/shared_organizations"
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

    ListAllPrivateDomains: function () {
      return {
        url: '/api/cf/v2/private_domains',

        response: {

          200: {

            body: {
              "total_results": 4,
              "total_pages": 1,
              "prev_url": null,
              "next_url": null,
              "resources": [
                {
                  "metadata": {
                    "guid": "cab24f65-5531-43a5-b50d-9c178e69e6b8",
                    "url": "/v2/private_domains/cab24f65-5531-43a5-b50d-9c178e69e6b8",
                    "created_at": "2016-02-19T02:03:49Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "vcap.me",
                    "owning_organization_guid": "dbc9862e-6e71-4bb8-a768-8d6597b5bd89",
                    "owning_organization_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89",
                    "shared_organizations_url": "/v2/private_domains/cab24f65-5531-43a5-b50d-9c178e69e6b8/shared_organizations"
                  }
                },
                {
                  "metadata": {
                    "guid": "e4f42087-c02e-45ce-b96d-d97235d1e1ef",
                    "url": "/v2/private_domains/e4f42087-c02e-45ce-b96d-d97235d1e1ef",
                    "created_at": "2016-02-19T02:03:59Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "domain-32.example.com",
                    "owning_organization_guid": "c112e629-dd2e-4cd2-a43a-b97b1bfee2f6",
                    "owning_organization_url": "/v2/organizations/c112e629-dd2e-4cd2-a43a-b97b1bfee2f6",
                    "shared_organizations_url": "/v2/private_domains/e4f42087-c02e-45ce-b96d-d97235d1e1ef/shared_organizations"
                  }
                },
                {
                  "metadata": {
                    "guid": "8e97bd1c-1191-4e0a-84b0-b25b745c7b54",
                    "url": "/v2/private_domains/8e97bd1c-1191-4e0a-84b0-b25b745c7b54",
                    "created_at": "2016-02-19T02:03:59Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "domain-33.example.com",
                    "owning_organization_guid": "06165653-9e1d-4a92-850f-b06918e4b83e",
                    "owning_organization_url": "/v2/organizations/06165653-9e1d-4a92-850f-b06918e4b83e",
                    "shared_organizations_url": "/v2/private_domains/8e97bd1c-1191-4e0a-84b0-b25b745c7b54/shared_organizations"
                  }
                },
                {
                  "metadata": {
                    "guid": "c4a0ab99-0f53-4b76-bd34-b7f9b04d9d02",
                    "url": "/v2/private_domains/c4a0ab99-0f53-4b76-bd34-b7f9b04d9d02",
                    "created_at": "2016-02-19T02:03:59Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "domain-34.example.com",
                    "owning_organization_guid": "7291787c-c28f-480e-8790-45e25c5a2bdb",
                    "owning_organization_url": "/v2/organizations/7291787c-c28f-480e-8790-45e25c5a2bdb",
                    "shared_organizations_url": "/v2/private_domains/c4a0ab99-0f53-4b76-bd34-b7f9b04d9d02/shared_organizations"
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

    ListAllSharedOrganizationsForPrivateDomain: function (guid) {
      return {
        url: '/api/cf/v2/private_domains/' + guid + '/shared_organizations',

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
                    "guid": guid,
                    "url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2",
                    "created_at": "2016-02-19T02:03:59Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "name-2221",
                    "billing_enabled": false,
                    "quota_definition_guid": "ab5f7ac7-0427-4f8a-b540-29b2aa4f67c9",
                    "status": "active",
                    "quota_definition_url": "/v2/quota_definitions/ab5f7ac7-0427-4f8a-b540-29b2aa4f67c9",
                    "spaces_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/spaces",
                    "domains_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/domains",
                    "private_domains_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/private_domains",
                    "users_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/users",
                    "managers_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/managers",
                    "billing_managers_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/billing_managers",
                    "auditors_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/auditors",
                    "app_events_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/app_events",
                    "space_quota_definitions_url": "/v2/organizations/98bd42d0-e90d-4792-8353-0c10597831f2/space_quota_definitions"
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

    RetrievePrivateDomain: function (guid) {
      return {
        url: '/api/cf/v2/private_domains/' + guid + '',

        response: {

          200: {

            body: {
              "metadata": {
                "guid": "cab24f65-5531-43a5-b50d-9c178e69e6b8",
                "url": "/v2/private_domains/cab24f65-5531-43a5-b50d-9c178e69e6b8",
                "created_at": "2016-02-19T02:03:49Z",
                "updated_at": null
              },
              "entity": {
                "name": "vcap.me",
                "owning_organization_guid": "dbc9862e-6e71-4bb8-a768-8d6597b5bd89",
                "owning_organization_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89",
                "shared_organizations_url": "/v2/private_domains/cab24f65-5531-43a5-b50d-9c178e69e6b8/shared_organizations"
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
