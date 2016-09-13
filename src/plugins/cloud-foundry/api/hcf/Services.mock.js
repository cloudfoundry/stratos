(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Services = {

    ListAllServices: function () {
      return {
        url: '/pp/v1/proxy/v2/services?results-per-page=100',

        response: {

          200: {

            body: {
              total_results: 2,
              total_pages: 1,
              prev_url: null,
              next_url: null,
              resources: [
                {
                  metadata: {
                    guid: "b55b3e8d-66df-475a-ba80-f6ca7edfcb41",
                    url: "/v2/services/b55b3e8d-66df-475a-ba80-f6ca7edfcb41",
                    created_at: "2016-02-19T02:03:48Z",
                    updated_at: null
                  },
                  entity: {
                    label: "label-19",
                    provider: null,
                    url: null,
                    description: "MySQL",
                    long_description: null,
                    version: 1,
                    info_url: null,
                    active: true,
                    bindable: true,
                    unique_id: "8be9090d-f716-4111-aa75-74ec99c30069",
                    extra: {
                      vendor: "Hewlett Packard Enterprise",
                      defaultVersion: 1,
                      versions: "1,2,3",
                      catalogId: "sample:mysql",
                      type: "external",
                      categories: "database",
                      labels: "User-label1",
                      imageUrl: "http://localhost:8081/v1/services/sample:mysql?image",
                      documentationUrl: "http://www.hpe.com/",
                      readme: "http://localhost:8081/v1/services/sample:mysql?readme"
                    },
                    tags: [],
                    requires: [],
                    documentation_url: null,
                    service_broker_guid: "f00db357-bedd-4432-bb51-890c26b5862e",
                    plan_updateable: false,
                    service_plans_url: "/v2/services/b55b3e8d-66df-475a-ba80-f6ca7edfcb41/service_plans"
                  }
                },
                {
                  metadata: {
                    guid: "b55b3e8d-66df-475a-ba80-f6ca7edfcb42",
                    url: "/v2/services/b55b3e8d-66df-475a-ba80-f6ca7edfcb42",
                    created_at: "2016-02-19T02:03:48Z",
                    updated_at: null
                  },
                  entity: {
                    label: "label-20",
                    provider: null,
                    url: null,
                    description: "SQL Server 2007",
                    long_description: null,
                    version: 2,
                    info_url: null,
                    active: true,
                    bindable: true,
                    unique_id: "8be9090d-f716-4111-aa75-74ec99c30068",
                    extra: {
                      vendor: "Hewlett Packard Enterprise",
                      defaultVersion: 1,
                      versions: "1,2,3",
                      catalogId: "sample:sqlserver",
                      type: "external",
                      categories: "database",
                      labels: "User-label2",
                      imageUrl: "http://localhost:8081/v1/services/sample:mysql?image",
                      documentationUrl: "http://www.hpe.com/",
                      readme: "http://localhost:8081/v1/services/sample:mysql?readme"
                    },
                    tags: [],
                    requires: [],
                    documentation_url: null,
                    service_broker_guid: "f00db357-bedd-4432-bb51-890c26b5862f",
                    plan_updateable: false,
                    service_plans_url: "/v2/services/b55b3e8d-66df-475a-ba80-f6ca7edfcb42/service_plans"
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

    ListAllServicePlansForService: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/services/' + guid + '/service_plans?results-per-page=100',
        response: {
          200: {
            body: {
              total_results: 1,
              total_pages: 1,
              prev_url: null,
              next_url: null,
              resources: [
                {
                  metadata: {
                    guid: "a5ac915f-b746-42c5-8506-6d318bf21107",
                    url: "/v2/service_plans/a5ac915f-b746-42c5-8506-6d318bf21107",
                    created_at: "2016-05-12T00:45:19Z",
                    updated_at: null
                  },
                  entity: {
                    name: "name-1686",
                    free: false,
                    description: "desc-109",
                    service_guid: "b2728c78-1057-4021-9c84-d2158f8f20df",
                    extra: null,
                    unique_id: "e010ae61-ec46-433d-bdf6-136ead10828b",
                    public: true,
                    active: true,
                    service_url: "/v2/services/b2728c78-1057-4021-9c84-d2158f8f20df",
                    service_instances_url: "/v2/service_plans/a5ac915f-b746-42c5-8506-6d318bf21107/service_instances"
                  }
                }
              ]
            }
          }
        }
      }
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
