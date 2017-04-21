(function () {
  'use strict';

  describe('cloud-foundry space model', function () {
    var $httpBackend, spaceModel, modelManager;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      modelManager = $injector.get('modelManager');
      spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('ListAllSpace', function () {
      var result;
      var ListAllSpaces = mock.cloudFoundryAPI.Spaces.ListAllSpaces();
      $httpBackend.whenGET(ListAllSpaces.url).respond(200, ListAllSpaces.response['200'].body);
      $httpBackend.expectGET(ListAllSpaces.url);
      expect(result).not.toBeDefined();
      spaceModel.listAllSpaces('guid', {}).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(ListAllSpaces.response['200'].body).toBeDefined();
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });

    it('ListAllServicesForSpace', function () {
      var result;
      var ListAllServicesForSpaceWithSSO = mock.cloudFoundryAPI.Spaces.ListAllServicesForSpaceWithSSO('guid');
      $httpBackend.whenGET(ListAllServicesForSpaceWithSSO.url).respond(200, ListAllServicesForSpaceWithSSO.response['200'].body);
      $httpBackend.expectGET(ListAllServicesForSpaceWithSSO.url);
      expect(result).not.toBeDefined();
      spaceModel.listAllServicesForSpace('cnsiGuid', 'guid', {}).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(ListAllServicesForSpaceWithSSO.response['200'].body).toBeDefined();
      expect(result).toBeDefined();
      expect(result.length).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0]._bindTarget).toBe('ROUTE');
      expect(result[1]._bindTarget).toBe('APP');
      expect(result[1]._bindTarget).toBe('APP');
    });

    it('ListAllServicesForSpace', function () {
      var result;
      var ListAllServicesForSpaceWithSSO = mock.cloudFoundryAPI.Spaces.ListAllServicesForSpaceWithSSO('guid');
      $httpBackend.whenGET(ListAllServicesForSpaceWithSSO.url).respond(200, ListAllServicesForSpaceWithSSO.response['200'].body);
      $httpBackend.expectGET(ListAllServicesForSpaceWithSSO.url);
      expect(result).not.toBeDefined();
      spaceModel.listAllServicesForSpace('cnsiGuid', 'guid', {}).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(ListAllServicesForSpaceWithSSO.response['200'].body).toBeDefined();
      expect(result).toBeDefined();
      expect(result.length).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0]._bindTarget).toBe('ROUTE');
      expect(result[1]._bindTarget).toBe('APP');
      expect(result[1]._bindTarget).toBe('APP');
    });

    it('spaceRoleToString', function () {
      expect(spaceModel.spaceRoleToString('space_user')).toBe('User');
      expect(spaceModel.spaceRoleToString('space_manager')).toBe('Manager');
      expect(spaceModel.spaceRoleToString('space_auditor')).toBe('Auditor');
      expect(spaceModel.spaceRoleToString('space_developer')).toBe('Developer');
      expect(spaceModel.spaceRoleToString('JUNK')).toBe('JUNK');
    });

    it('spaceRolesToStrings', function () {
      expect(spaceModel.spaceRolesToStrings()).toEqual(['none assigned']);
      expect(spaceModel.spaceRolesToStrings(['space_developer', 'space_auditor', 'space_manager']))
        .toEqual(['Manager', 'Auditor', 'Developer']);
    });

    it('fetch space', function () {
      var cnsiGuid = 'cnsiGuid';
      var spaceGuid = 'spaceGuid';
      expect(spaceModel.fetchSpace()).toBeUndefined();

      _.set(spaceModel, 'spaces.' + cnsiGuid, {});
      expect(spaceModel.fetchSpace(cnsiGuid, spaceGuid)).toBeUndefined();

      var space = 'i am a space';
      _.set(spaceModel, 'spaces.' + cnsiGuid + '.' + spaceGuid, space);
      expect(spaceModel.fetchSpace(cnsiGuid, spaceGuid)).toBe(space);
    });

    it('getSpaceDetails - no inline data', function () {
      var cnsiGuid = 'cnsiGuid';
      var spaceGuid = 'spaceGuid';

      var RetrievingRolesOfAllUsersInSpace = mock.cloudFoundryAPI.Spaces.RetrievingRolesOfAllUsersInSpace(spaceGuid);
      $httpBackend.expectGET(RetrievingRolesOfAllUsersInSpace.url).respond(200, RetrievingRolesOfAllUsersInSpace.response['200'].body);

      var ListAllAppsForSpace = mock.cloudFoundryAPI.Spaces.ListAllAppsForSpaceNoPassthrough(spaceGuid);
      $httpBackend.expectGET(ListAllAppsForSpace.url).respond(200, ListAllAppsForSpace.response['200'].body);

      var userGuid = 'userGuid';
      _.set(modelManager.retrieve('app.model.stackatoInfo'), 'info', userGuid);

      var space = {
        metadata: {
          guid: spaceGuid,
          created_at: '2016-02-19T02:04:05Z'
        },
        entity: {
        }
      };

      var expectedSpaceDetail = {
        guid: 'spaceGuid',
        space: space,
        created_at: 1455847445,
        memUsed: 0,
        memQuota: -1,
        totalApps: 1,
        totalAppInstances: 0,
        appInstancesQuota: -1,
        roles: [],
        totalServices: undefined,
        servicesQuota: -1,
        totalRoutes: undefined,
        routesQuota: -1,
        totalServiceInstances: undefined,
        serviceInstancesQuota: -1
      };

      var expectedCachedSpace = {
        roles: {
          hcf_auto_config: undefined,
          '280391c9-335d-4f03-83d9-af64fc315b6c': undefined,
          '0683b8d1-767d-4063-9ae6-bc2194d7f3da': undefined
        },
        apps: ListAllAppsForSpace.response[200].body.resources,
        details: expectedSpaceDetail
      };

      spaceModel.getSpaceDetails(cnsiGuid, space).then(function (actualSpaceDetail) {
        expect(actualSpaceDetail).toEqual(expectedSpaceDetail);
        expect(spaceModel.fetchSpace(cnsiGuid, spaceGuid)).toEqual(expectedCachedSpace);
      });
      $httpBackend.flush();

    });

    it('getSpaceDetails - inline data', function () {
      var cnsiGuid = 'cnsiGuid';
      var spaceGuid = 'spaceGuid';

      var ListAllAppsForSpace = mock.cloudFoundryAPI.Spaces.ListAllAppsForSpaceNoPassthrough(spaceGuid);

      var userGuid = 'userGuid';
      _.set(modelManager.retrieve('app.model.stackatoInfo'), 'info', userGuid);

      var space = {
        metadata: {
          guid: spaceGuid,
          created_at: '2016-02-19T02:04:05Z'
        },
        entity: {
          service_instances: [ { item: 1 } ],
          space_quota_definition_guid: 'space_quota_definition_guidGuid',
          space_quota_definition: {
            metadata: {
              guid: 'space_quota_definition_guidGuid'
            },
            entity: {
              memory_limit: 1,
              app_instance_limit: 2,
              total_services: 3,
              total_routes: 4
            }
          },
          apps: ListAllAppsForSpace.response[200].body.resources,
          managers: [],
          developers: [],
          auditors: []
        }
      };

      var expectedSpaceDetail = {
        guid: 'spaceGuid',
        space: space,
        created_at: 1455847445,
        memUsed: 0,
        memQuota: 1,
        totalApps: 1,
        totalAppInstances: 0,
        appInstancesQuota: 2,
        roles: [],
        totalServices: undefined,
        servicesQuota: 3,
        totalRoutes: undefined,
        routesQuota: 4,
        totalServiceInstances: 1,
        serviceInstancesQuota: 3
      };

      var expectedCachedSpace = {
        roles: { },
        apps: ListAllAppsForSpace.response[200].body.resources,
        details: expectedSpaceDetail
      };

      spaceModel.getSpaceDetails(cnsiGuid, space).then(function (actualSpaceDetail) {
        expect(actualSpaceDetail).toEqual(expectedSpaceDetail);
        expect(spaceModel.fetchSpace(cnsiGuid, spaceGuid)).toEqual(expectedCachedSpace);
      });
      // $httpBackend.flush();
    });

  });

})();
