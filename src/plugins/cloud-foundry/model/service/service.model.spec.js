(function () {
  'use strict';

  describe('service model', function () {
    var $httpBackend, serviceModel, mockData;

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      serviceModel = modelManager.retrieve('cloud-foundry.model.service');

      mockData = {
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
      };

    }));

    it('should be defined', function () {
      expect(serviceModel).toBeDefined();
    });

    // property definitions

    it('should have properties `apiManager` defined', function () {
      expect(serviceModel.serviceApi).toBeDefined();
    });

    it('should have properties `data` defined', function () {
      expect(serviceModel.data).toBeDefined();
      expect(serviceModel.data).toEqual({});
    });

    // method definitions

    it('should have method `all` defined', function () {
      expect(angular.isFunction(serviceModel.all)).toBe(true);
    });

    it('should have method `usage` defined', function () {
      expect(angular.isFunction(serviceModel.usage)).toBe(true);
    });

    it('should have method `files` defined', function () {
      expect(angular.isFunction(serviceModel.files)).toBe(true);
    });

    it('should have method `onAll` defined', function () {
      expect(angular.isFunction(serviceModel.onAll)).toBe(true);
    });

    it('should have method `onUsage` defined', function () {
      expect(angular.isFunction(serviceModel.onUsage)).toBe(true);
    });

    it('should have method `onFiles` defined', function () {
      expect(angular.isFunction(serviceModel.onFiles)).toBe(true);
    });

    // method calls
    it('should set `data` on all()', function () {

      $httpBackend.when('GET', '/pp/v1/proxy/v2/services')
        .respond(200, mockData);

      serviceModel.all().then(function () {
        expect(serviceModel.data).toEqual(mockData);
      });

      $httpBackend.flush();
    });

  });

})();
