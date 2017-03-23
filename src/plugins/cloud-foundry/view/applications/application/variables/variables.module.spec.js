(function () {
  'use strict';

  describe('variables view', function () {
    var $controller, createController, $rootScope, $q;
    var cnsiGuid = 'HCF_GUID';
    var guid = 'APP_ID';

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
      var modelManager = $injector.get('modelManager');
      var $stateParams = $injector.get('$stateParams');
      var $state = $injector.get('$state');
      var appVarsManager = $injector.get('cloud-foundry.view.applications.application.variables.manager');
      $stateParams.cnsiGuid = cnsiGuid;
      $stateParams.guid = guid;
      var ApplicationVariablesController = $state.get('cf.applications.application.variables').controller;
      createController = function (avMgr) {
        return new ApplicationVariablesController(modelManager, $stateParams, avMgr);
      };
      $controller = createController(appVarsManager);
      expect($controller).toBeDefined();
      expect($controller).not.toBe(null);
      expect($controller.isObject).toBeDefined();
    }));

    it('isObject checks', function () {
      expect($controller.isObject(123)).toBe(false);
      expect($controller.isObject({name: true})).toBe(true);
      expect($controller.isObject(['name'])).toBe(true);
    });

    describe('no variables checks', function () {
      beforeEach(inject(function ($injector) {
        var modelManager = $injector.get('modelManager');
        var model = modelManager.retrieve('cloud-foundry.model.application');
        model.application = {variables: undefined};
      }));

      it('should not have any variables', function () {
        expect($controller.hasVariables()).toBe(false);
      });
    });

    describe('with variables checks', function () {
      beforeEach(inject(function ($injector) {
        var modelManager = $injector.get('modelManager');
        //variables.environment_json
        var model = modelManager.retrieve('cloud-foundry.model.application');
        model.application = {
          variables: {
            environment_json: {
              ENV_1: 'TEST1',
              env_2: 'test2',
              test_3: 'value_3'
            }
          }
        };
      }));

      it('should have variables', function () {
        expect($controller.hasVariables()).toBe(true);
      });
    });

    describe('refresh', function () {
      var $httpBackend;
      beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
      }));

      it('should handle failure', function () {
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/' + guid + '/env').respond(500, {error: 'Test 500'});
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps/' + guid + '/env');
        $controller.refreshVariables();
        $httpBackend.flush();
        expect($controller.fetchError).toBe(true);
        expect($controller.isBusy).toBe(false);
      });

      it('should handle success', function () {
        var data = {
          environment_json: {
            env_1: 'test1'
          }
        };
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/' + guid + '/env').respond(200, data);
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps/' + guid + '/env');
        spyOn($controller, 'refreshVariables');
        $controller.refreshVariables();
        $httpBackend.flush();
        expect($controller.fetchError).toBe(false);
        expect($controller.isBusy).toBe(false);
        expect($controller.variableNames.length).toBe(1);
        expect($controller.variableNames[0]).toBe('env_1');
        expect($controller.refreshVariables).toHaveBeenCalled();
      });
    });

    describe('add', function () {
      var $httpBackend;
      beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/' + guid + '/env').respond(500, {error: 'Test 500'});
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps/' + guid + '/env');
      }));

      it('should not refresh when add fails', function () {
        var controller = createController({
          add: function () {
            return $q.reject();
          }
        });
        $rootScope.$apply();
        spyOn(controller, 'refreshVariables');
        controller.addVariable();
        $rootScope.$apply();
        expect(controller.refreshVariables).not.toHaveBeenCalled();
      });

      it('should refresh when add succeeds', function () {
        var controller = createController({
          add: function () {
            return $q.resolve();
          }
        });
        spyOn(controller, 'refreshVariables');
        controller.addVariable();
        $rootScope.$apply();
        expect(controller.refreshVariables).toHaveBeenCalled();
        expect(controller.refreshVariables.calls.count()).toBe(1);
      });
    });

    describe('edit', function () {
      var $httpBackend;
      beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/' + guid + '/env').respond(500, {error: 'Test 500'});
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps/' + guid + '/env');
      }));

      it('should not refresh when edit fails', function () {
        var controller = createController({
          edit: function (cnsi, guid, name) {
            expect(name).toBe('test_123');
            return $q.reject();
          }
        });
        $rootScope.$apply();
        spyOn(controller, 'refreshVariables');
        controller.editVariable('test_123');
        $rootScope.$apply();
        expect(controller.refreshVariables).not.toHaveBeenCalled();
      });

      it('should refresh when edit succeeds', function () {
        var controller = createController({
          edit: function (cnsi, guid, name) {
            expect(name).toBe('test_123');
            return $q.resolve();
          }
        });
        spyOn(controller, 'refreshVariables');
        controller.editVariable('test_123');
        $rootScope.$apply();
        expect(controller.refreshVariables).toHaveBeenCalled();
        expect(controller.refreshVariables.calls.count()).toBe(1);
      });
    });

    describe('delete', function () {
      var $httpBackend;
      beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.when('GET', '/pp/v1/proxy/v2/apps/' + guid + '/env').respond(500, {error: 'Test 500'});
        $httpBackend.expectGET('/pp/v1/proxy/v2/apps/' + guid + '/env');
      }));

      it('should not refresh when delete fails', function () {
        var controller = createController({
          delete: function (cnsi, guid, name) {
            expect(name).toBe('test_123');
            return $q.reject();
          }
        });
        $rootScope.$apply();
        spyOn(controller, 'refreshVariables');
        controller.deleteVariable('test_123');
        expect(controller.isBusy).toBe(true);
        $rootScope.$apply();
        expect(controller.refreshVariables).not.toHaveBeenCalled();
        expect(controller.deleteError).toBe('test_123');
        expect(controller.isBusy).toBe(false);
      });

      it('should refresh when delete succeeds', function () {
        var controller = createController({
          delete: function (cnsi, guid, name) {
            expect(name).toBe('test_123');
            return $q.resolve();
          }
        });
        spyOn(controller, 'refreshVariables');
        controller.deleteVariable('test_123');
        expect(controller.isBusy).toBe(true);
        $rootScope.$apply();
        expect(controller.refreshVariables).toHaveBeenCalled();
        expect(controller.refreshVariables.calls.count()).toBe(1);
        expect(controller.deleteError).toBe(false);
        expect(controller.isBusy).toBe(false);
      });
    });
  });
})();
