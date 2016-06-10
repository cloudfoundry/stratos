(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.PrivateDomains = {

    FilterPrivateDomainsByName: function () {
      return {
        url: '/pp/v1/proxy/v2/private_domains',

        response: {

          200: {

            body: {
              "guid": {
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
            }
          },

          500: {
            body: { guid: {} }
          }

        }
      };
    },

    ListAllPrivateDomains: function () {
      return {
        url: '/pp/v1/proxy/v2/private_domains',

        response: {

          200: {

            body: {
              "guid": {
                "total_results": 2,
                "total_pages": 1,
                "prev_url": null,
                "next_url": null,
                "resources": [
                  {
                    "metadata": {
                      "guid": "6ea5aeab-cced-43ad-b1bd-44057d2c648f",
                      "url": "/v2/private_domains/6ea5aeab-cced-43ad-b1bd-44057d2c648f",
                      "created_at": "2016-04-20T18:45:03Z",
                      "updated_at": null
                    },
                    "entity": {
                      "name": "example.com",
                      "owning_organization_guid": "2fe5b39d-2147-4687-88d1-07abf3500e41",
                      "owning_organization_url": "/v2/organizations/2fe5b39d-2147-4687-88d1-07abf3500e41",
                      "shared_organizations_url": "/v2/private_domains/6ea5aeab-cced-43ad-b1bd-44057d2c648f/shared_organizations"
                    }
                  },
                  {
                    "metadata": {
                      "guid": "36d72b3b-1bf5-44a0-9aa8-7401a78e484d",
                      "url": "/v2/private_domains/36d72b3b-1bf5-44a0-9aa8-7401a78e484d",
                      "created_at": "2016-04-20T20:33:13Z",
                      "updated_at": null
                    },
                    "entity": {
                      "name": "example.net",
                      "owning_organization_guid": "2fe5b39d-2147-4687-88d1-07abf3500e41",
                      "owning_organization_url": "/v2/organizations/2fe5b39d-2147-4687-88d1-07abf3500e41",
                      "shared_organizations_url": "/v2/private_domains/36d72b3b-1bf5-44a0-9aa8-7401a78e484d/shared_organizations"
                    }
                  }
                ]
              }
            }
          },

          500: {
            body: { guid: {} }
          }

        }
      };
    },

    ListAllSharedOrganizationsForPrivateDomain: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/private_domains/' + guid + '/shared_organizations',

        response: {

          200: {

            body: {
              "36d72b3b-1bf5-44a0-9aa8-7401a78e484d": {
                "total_results": 1,
                "total_pages": 1,
                "prev_url": null,
                "next_url": null,
                "resources": [
                  {
                    "metadata": {
                      "guid": "5b401ba9-4314-4e7c-939f-1c3a1dd722e7",
                      "url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7",
                      "created_at": "2016-04-20T22:48:22Z",
                      "updated_at": null
                    },
                    "entity": {
                      "name": "HPQ",
                      "billing_enabled": false,
                      "quota_definition_guid": "06c73405-4038-469e-99dd-585f0f544641",
                      "status": "active",
                      "is_default": false,
                      "quota_definition_url": "/v2/quota_definitions/06c73405-4038-469e-99dd-585f0f544641",
                      "spaces_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/spaces",
                      "domains_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/domains",
                      "private_domains_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/private_domains",
                      "users_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/users",
                      "managers_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/managers",
                      "billing_managers_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/billing_managers",
                      "auditors_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/auditors",
                      "app_events_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/app_events",
                      "space_quota_definitions_url": "/v2/organizations/5b401ba9-4314-4e7c-939f-1c3a1dd722e7/space_quota_definitions"
                    }
                  }
                ]
              },
              "6ea5aeab-cced-43ad-b1bd-44057d2c648f": {
                "total_results": 0,
                "total_pages": 1,
                "prev_url": null,
                "next_url": null,
                "resources": []
              }
            }
          },

          500: {
            body: { guid: {} }
          }

        }
      };
    },

    RetrievePrivateDomain: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/private_domains/' + guid + '',

        response: {

          200: {

            body: {
              "guid": {
                "metadata": {
                  "guid": "6ea5aeab-cced-43ad-b1bd-44057d2c648f",
                  "url": "/v2/private_domains/6ea5aeab-cced-43ad-b1bd-44057d2c648f",
                  "created_at": "2016-04-20T18:45:03Z",
                  "updated_at": null
                },
                "entity": {
                  "name": "example.com",
                  "owning_organization_guid": "2fe5b39d-2147-4687-88d1-07abf3500e41",
                  "owning_organization_url": "/v2/organizations/2fe5b39d-2147-4687-88d1-07abf3500e41",
                  "shared_organizations_url": "/v2/private_domains/6ea5aeab-cced-43ad-b1bd-44057d2c648f/shared_organizations"
                }
              }
            }
          },

          500: {
            body: { guid: {} }
          }

        }
      };
    }
  };

/* eslint-enable quote-props */
})(this.mock = this.mock || {});
