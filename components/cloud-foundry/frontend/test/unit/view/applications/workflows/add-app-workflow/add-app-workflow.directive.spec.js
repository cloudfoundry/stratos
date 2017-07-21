(function () {
  'use strict';

  /* eslint-disable angular/no-private-call */
  describe('add-app-workflow directive', function () {
    var $httpBackend, $scope, $translate, that, $q, authModel, serviceInstanceModel, appModel, routeModel, spaceModel,
      privateDomainModel, sharedDomainModel, cfOrganizationModel, appEventService;

    function getResolved() {
      return $q.resolve();
    }

    function getRejected() {
      return $q.reject();
    }

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      $translate = $injector.get('$translate');
      var modelManager = $injector.get('modelManager');
      authModel = modelManager.retrieve('cloud-foundry.model.auth');
      serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      appModel = modelManager.retrieve('cloud-foundry.model.application');
      routeModel = modelManager.retrieve('cloud-foundry.model.route');
      spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      privateDomainModel = modelManager.retrieve('cloud-foundry.model.private-domain');
      sharedDomainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');
      $q = $injector.get('$q');
      cfOrganizationModel = $injector.get('cfOrganizationModel');
      appEventService = $injector.get('appEventService');

      $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, {});
      $httpBackend.expectGET('/pp/v1/cnsis/registered');

      $scope.testDismiss = function () {};
      $scope.testClose = function () {};

      var organizations = mock.cloudFoundryAPI.Organizations.ListAllOrganizations(123).response['200'].body.resources;
      cfOrganizationModel.listAllOrganizations = function () {
        return $q.resolve(organizations);
      };

      var markup = '<add-app-workflow close-dialog="testClose" dismiss-dialog="testDismiss"></add-app-workflow>';
      var element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();
      that = element.controller('addAppWorkflow');
      $httpBackend.flush();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be compilable', function () {
      expect(that).toBeDefined();
    });

    describe('- after init', function () {
      beforeEach(function () {
      });

      it('should watch userInput.space', function () {
        spyOn(that, 'getAppsForSpace');
        that.userInput.space = {
          metadata: {
            guid: 'space-guid'
          }
        };
        $scope.$apply();
        expect(that.getAppsForSpace).toHaveBeenCalledWith('space-guid');
      });

      describe('- after reset', function () {
        beforeEach(function () {
          that.reset();
        });

        it('should be set properly', function () {
          expect(that.userInput).toEqual({
            name: null,
            serviceInstance: null,
            clusterUsername: null,
            clusterPassword: null,
            organization: null,
            space: null,
            host: null,
            domain: null,
            application: null,
            cfApiEndpoint: null,
            cfUserName: null
          });
          expect(that.data.workflow).toBeDefined();
          expect($translate.instant(that.data.workflow.title)).toBe('Add Application');
          expect(that.data.workflow.steps.length).toBe(1);
          expect(that.options.services).toEqual([]);
          expect(that.options.organizations).toEqual([]);
          expect(that.options.spaces).toEqual([]);
          expect(that.options.domains).toEqual([]);
          expect(that.options.errors).toEqual({});
          expect(that.options.apps).toEqual([]);
        });

        it('addApplicationActions - stop', function () {
          spyOn(that, 'stopWorkflow');
          that.addApplicationActions.stop();
          expect(that.stopWorkflow).toHaveBeenCalled();
        });

        it('addApplicationActions - finish', function () {
          spyOn(that, 'finishWorkflow');
          that.addApplicationActions.finish();
          expect(that.finishWorkflow).toHaveBeenCalled();
        });

        describe('step 1 - Application Name', function () {
          var step, mockData;

          beforeEach(function () {
            step = that.data.workflow.steps[0];
            mockData = [
              { id: 1, name: 'cluster1', url:' cluster1_url', cnsi_type: 'cf', valid: true },
              { id: 2, name: 'cluster2', url:' cluster2_url', cnsi_type: 'misc', valid: true }
            ];
          });

          it('should have right title and button labels', function () {
            expect($translate.instant(step.btnText.next)).toBe('Add');
            expect($translate.instant(step.btnText.cancel)).toBe('Cancel');
            expect(step.showBusyOnNext).toBe(true);
          });

          it('onEnter', function () {
            authModel.doesUserHaveRole = function () { return true; };
            serviceInstanceModel.list = function () {
              return $q.resolve(mockData);
            };
            that.getDomains = getResolved;
            spyOn(that, 'getDomains').and.callThrough();
            spyOn(serviceInstanceModel, 'list').and.callThrough();
            _.set(authModel, 'principal.undefined.userSummary.spaces.all', []);
            that.userInput.serviceInstance = {};
            step.onEnter();
            $scope.$apply();

            expect(that.getDomains).toHaveBeenCalled();
            expect(serviceInstanceModel.list).toHaveBeenCalled();
            expect(that.options.serviceInstances.length).toBe(1);
            expect(that.options.serviceInstances[0].label).toBe('cluster1');
          });

          it('onEnter - when that.options.userInput.serviceInstance is null', function () {
            stopWatch();
            simulateUserInput();
            _.set(authModel, 'principal.undefined.userSummary.spaces.all', []);
            that.options.userInput.serviceInstance = null;
            appModel.filterParams = { cnsiGuid: 'no all' };

            authModel.doesUserHaveRole = function () { return true; };
            serviceInstanceModel.list = function () {
              return $q.resolve(mockData);
            };
            spyOn(serviceInstanceModel, 'list').and.callThrough();
            step.onEnter();
            $scope.$apply();

            expect(serviceInstanceModel.list).toHaveBeenCalled();
            expect(that.options.serviceInstances.length).toBe(1);
            expect(that.options.serviceInstances[0].label).toBe('cluster1');
          });

          it('onNext - invalid route', function () {
            that.validateNewRoute = getRejected;
            var p = step.onNext();
            $scope.$apply();
            expect(p.$$state.status).toBe(2);
          });

          it('onNext - creating application failed', function () {
            stopWatch();
            simulateUserInput();
            _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
            spyOn(that, 'validateNewRoute').and.returnValue($q.resolve());
            spyOn(that, 'createApp').and.returnValue($q.reject()); // <== here
            var p = step.onNext();
            $scope.$apply();
            expect(p.$$state.status).toBe(2);
            expect(p.$$state.value).toBe('There was a problem creating your application. Please try again or contact your administrator if the problem persists.');
          });

          it('onNext - valid route', function () {
            var services = mock.cloudFoundryAPI.Spaces.ListAllServiceInstancesForSpace(123).response[200].body.resources;
            stopWatch();
            simulateUserInput();
            _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
            spyOn(that, 'validateNewRoute').and.returnValue($q.resolve());
            spyOn(that, 'createApp').and.returnValue($q.resolve());
            spyOn(spaceModel, 'listAllServicesForSpace').and.returnValue($q.resolve(services));
            expect(that.options.services.length).toBe(0);
            var p = step.onNext();
            $scope.$apply();
            expect(p.$$state.status).toBe(1);
            expect(that.validateNewRoute).toHaveBeenCalled();
            expect(that.createApp).toHaveBeenCalled();
          });
        });

        it('createApp', function () {
          simulateWatch();
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          spaceModel.listAllAppsForSpace = function () {
            return $q.resolve(mock.cloudFoundryAPI.Spaces.ListAllAppsForSpace(123).response['200'].body.guid.resources);
          };
          var newAppSpec = {
            name: that.userInput.name,
            space_guid: that.userInput.space.metadata.guid
          };
          appModel.createApp = function () {
            return $q.resolve(mock.cloudFoundryAPI.Apps.CreateApp(newAppSpec).response[201].body);
          };
          spyOn(appModel, 'createApp').and.callThrough();

          that.createApp();
          $scope.$apply();

          expect(appModel.createApp).toHaveBeenCalled();
          expect(appModel.getAppSummary).toHaveBeenCalled();
          expect(routeModel.createRoute).toHaveBeenCalled();
          expect(routeModel.associateAppWithRoute).toHaveBeenCalled();
          expect(that.getDomains).toHaveBeenCalled();
        });

        it('#validateNewRoute - route already exists', function () {
          simulateWatch();
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          spaceModel.listAllAppsForSpace = function () {
            return $q.resolve(mock.cloudFoundryAPI.Spaces.ListAllAppsForSpace(123).response['200'].body.guid.resources);
          };
          routeModel.checkRouteExists = function () {
            return $q.resolve({
            });
          };
          spyOn(routeModel, 'checkRouteExists').and.callThrough();

          var p = that.validateNewRoute();
          $scope.$apply();

          expect(routeModel.checkRouteExists).toHaveBeenCalled();
          expect(p.$$state.status).toBe(2);
          expect(p.$$state.value).toBe('This route already exists. Choose a new one.');
        });

        it('#validateNewRoute - valid route', function () {
          simulateWatch();
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          spaceModel.listAllAppsForSpace = function () {
            return $q.resolve(mock.cloudFoundryAPI.Spaces.ListAllAppsForSpace(123).response['200'].body.guid.resources);
          };
          routeModel.checkRouteExists = function () {
            return $q.reject({
              status: 404
            });
          };
          spyOn(routeModel, 'checkRouteExists').and.callThrough();

          var p = that.validateNewRoute();
          $scope.$apply();

          expect(routeModel.checkRouteExists).toHaveBeenCalled();
          expect(p.$$state.status).toBe(1);
          expect(p.$$state.value).toBeUndefined();
        });

        it('#validateNewRoute - failed on checking', function () {
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          spaceModel.listAllAppsForSpace = function () {
            return $q.resolve(mock.cloudFoundryAPI.Spaces.ListAllAppsForSpace(123).response['200'].body.guid.resources);
          };
          simulateWatch();
          routeModel.checkRouteExists = function () {
            return $q.reject({
            });
          };
          spyOn(routeModel, 'checkRouteExists').and.callThrough();

          var p = that.validateNewRoute();
          $scope.$apply();

          expect(routeModel.checkRouteExists).toHaveBeenCalled();
          expect(p.$$state.status).toBe(2);
          expect(p.$$state.value).toBe('There was a problem validating your route. Please try again or contact your administrator if the problem persists.');
        });

        it('#getAppsForSpace', function () {
          stopWatch();
          simulateUserInput();
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          spaceModel.listAllAppsForSpace = function () {
            return $q.resolve(mock.cloudFoundryAPI.Spaces.ListAllAppsForSpace(123).response['200'].body.guid.resources);
          };
          spyOn(spaceModel, 'listAllAppsForSpace').and.callThrough();
          expect(that.options.apps.length).toBe(0);
          that.getAppsForSpace();
          $scope.$apply();
          expect(spaceModel.listAllAppsForSpace).toHaveBeenCalled();
          expect(that.options.apps.length).toBe(1);
          expect(that.options.apps[0].label).toBe('name-2500');
        });

        it('#getDomains', function () {
          spyOn(that, 'getPrivateDomains');
          spyOn(that, 'getSharedDomains');
          that.getDomains();
          expect(that.options.domains.length).toBe(0);
          expect(that.getPrivateDomains).toHaveBeenCalled();
          expect(that.getSharedDomains).toHaveBeenCalled();
        });

        it('#getPrivateDomains', function () {
          stopWatch();
          simulateUserInput();
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          privateDomainModel.listAllPrivateDomains = function () {
            return $q.resolve(mock.cloudFoundryAPI.PrivateDomains.ListAllPrivateDomains().response['200'].body.resources);
          };
          spyOn(privateDomainModel, 'listAllPrivateDomains').and.callThrough();
          expect(that.options.domains.length).toBe(0);
          that.getPrivateDomains();
          $scope.$apply();
          expect(that.options.domains.length).toBe(2);
        });

        it('#getSharedDomains', function () {
          stopWatch();
          simulateUserInput();
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          sharedDomainModel.listAllSharedDomains = function () {
            return $q.resolve(mock.cloudFoundryAPI.SharedDomains.ListAllSharedDomains().response['200'].body.resources);
          };
          spyOn(sharedDomainModel, 'listAllSharedDomains').and.callThrough();
          expect(that.options.domains.length).toBe(0);
          that.getSharedDomains();
          $scope.$apply();
          expect(that.options.domains.length).toBe(2);
        });

        it('#notify - has application created', function () {
          stopWatch();
          simulateUserInput();
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          that.userInput.application = { summary: { guid: 'appGuid' } };
          var stateValue;
          appEventService.$on(appEventService.events.REDIRECT, function (event, state) {
            stateValue = state;
          });
          that.notify();
          expect(stateValue).toBe('cf.applications.application.summary');
        });

        it('#notify - has no created', function () {
          stopWatch();
          simulateUserInput();
          _.set(authModel, 'principal.cnsiGuid_123.userSummary.spaces.all', []);
          var stateValue;
          appEventService.$on(appEventService.events.REDIRECT, function (event, state) {
            stateValue = state;
          });
          that.notify();
          expect(stateValue).toBeUndefined();
        });

        it('#startWorkflow', function () {
          spyOn(that, 'reset');
          that.startWorkflow();
          expect(that.addingApplication).toBe(true);
          expect(that.reset).toHaveBeenCalled();
          that.addingApplication = false;
        });

        it('#stopWorkflow', function () {
          spyOn(that, 'notify');
          that.stopWorkflow();
          expect(that.notify).toHaveBeenCalled();
          expect(that.addingApplication).toBe(false);
        });

        it('#finishWorkflow', function () {
          spyOn(that, 'notify');
          that.finishWorkflow();
          expect(that.notify).toHaveBeenCalled();
          expect(that.addingApplication).toBe(false);
        });

      });
    });

    function stopWatch() {
      that.stopWatchServiceInstance();
      that.stopWatchSpace();
    }

    function simulateUserInput() {
      that.userInput.serviceInstance = { guid: 'cnsiGuid_123', api_endpoint: { Scheme: 'https' } };
      that.userInput.name = 'myapp';
      that.userInput.space = { metadata: { guid: 'space_guid' } };
      that.userInput.host = 'myapp';
      that.userInput.domain = { metadata: { guid: 'my.domain.com' } };
    }

    function simulateWatch() {
      appModel.getAppSummary = function () {
        return $q.resolve(mock.cloudFoundryAPI.Apps.GetAppSummary('84a911b3-16f7-4f47-afa4-581c86018600').response[200].body);
      };
      routeModel.createRoute = function () {
        return $q.resolve({
          metadata: { guid: 'af96374d-3f82-4956-8af2-f2a7b572458e' }
        });
      };
      routeModel.associateAppWithRoute = function () {
        return $q.resolve({
        });
      };
      that.getDomains = function () {
        return $q.resolve({
        });
      };

      spyOn(appModel, 'getAppSummary').and.callThrough();
      spyOn(routeModel, 'createRoute').and.callThrough();
      spyOn(routeModel, 'associateAppWithRoute').and.callThrough();
      spyOn(that, 'getDomains').and.callThrough();

      simulateUserInput();
    }
  });

  /* eslint-enable angular/no-private-call */
})();
