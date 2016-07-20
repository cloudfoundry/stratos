(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Organizations = {

    ListAllOrganizations: function () {
      return {
        url: '/pp/v1/proxy/v2/organizations',

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
                    "guid": "dbc9862e-6e71-4bb8-a768-8d6597b5bd89",
                    "url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89",
                    "created_at": "2016-02-19T02:03:49Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "the-system_domain-org-name",
                    "billing_enabled": false,
                    "quota_definition_guid": "2df4aaef-48e2-40ff-96d0-f2cbb620c3a3",
                    "status": "active",
                    "quota_definition_url": "/v2/quota_definitions/2df4aaef-48e2-40ff-96d0-f2cbb620c3a3",
                    "spaces_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/spaces",
                    "domains_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/domains",
                    "private_domains_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/private_domains",
                    "users_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/users",
                    "managers_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/managers",
                    "billing_managers_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/billing_managers",
                    "auditors_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/auditors",
                    "app_events_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/app_events",
                    "space_quota_definitions_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/space_quota_definitions"
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

    ListAllSpacesForOrganization: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/organizations/' + guid + '/spaces',

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
                    "guid": "0063f106-074b-415a-94ee-5cf3afd7db5c",
                    "url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c",
                    "created_at": "2016-02-19T02:04:00Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "name-2294",
                    "organization_guid": "5d99d1f5-daab-418d-9ef4-e2f7aa825a61",
                    "space_quota_definition_guid": null,
                    "allow_ssh": true,
                    "organization_url": "/v2/organizations/5d99d1f5-daab-418d-9ef4-e2f7aa825a61",
                    "developers_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/developers",
                    "managers_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/managers",
                    "auditors_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/auditors",
                    "apps_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/apps",
                    "routes_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/routes",
                    "domains_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/domains",
                    "service_instances_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/service_instances",
                    "app_events_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/app_events",
                    "events_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/events",
                    "security_groups_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/security_groups"
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
