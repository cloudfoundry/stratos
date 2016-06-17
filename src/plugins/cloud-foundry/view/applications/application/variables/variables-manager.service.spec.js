(function () {
  'use strict';

  describe('variables manager service', function () {
    var $controller, $q, modelManager, dialogContext, dialog;

    beforeEach(module('green-box-console'));
    beforeEach(module(function ($provide) {
      var mock = function(config, context) {
        dialogContext = context;
        $controller = config.controller;
        return $q.reject();
      };
      $provide.value('helion.framework.widgets.detailView', mock);
    }));

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      modelManager = $injector.get('app.model.modelManager');
      var appModel = modelManager.retrieve('cloud-foundry.model.application');
      appModel.application.variables = {
        environment_json: {
          edit_var: 'edit_value',
          add_var: 'add_value',
          three_var: '3value'
        }
      };
    }));

    describe("add", function() {
      beforeEach(inject(function ($injector) {
        var appVarsManager = $injector.get('cloud-foundry.view.applications.application.variables.manager');
        dialog = appVarsManager.add('test_guid', 'test_id');
        expect(dialog).not.toBe(null);
      }));

      it("check var name and value are empty", function() {
        var controller = new $controller(modelManager, undefined, dialogContext);
        expect(controller.varName).toBe('');
        expect(controller.varValue).toBe('');
        expect(controller.isEdit).toBe(false);
      });
    });

    describe("edit", function() {
      beforeEach(inject(function ($injector) {
        var appVarsManager = $injector.get('cloud-foundry.view.applications.application.variables.manager');
        dialog = appVarsManager.edit('test_guid', 'test_id', 'edit_var');
        expect(dialog).not.toBe(null);
      }));
      it("check var name and value are not empty", function() {
        var controller = new $controller(modelManager, undefined, dialogContext);
        expect(controller.varName).toBe('edit_var');
        expect(controller.varValue).toBe('edit_value');
        expect(controller.isEdit).toBe(true);
      });
    });

    describe("apply changes", function() {
      var APP_VAR_UPDATE = '/pp/v1/proxy/v2/apps/test_id';
      var $httpBackend;
      var fakeModal = { close: jasmine.createSpy('dialogClose') };

      beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.expectPUT(APP_VAR_UPDATE);
        var appVarsManager = $injector.get('cloud-foundry.view.applications.application.variables.manager');
        dialog = appVarsManager.edit('test_guid', 'test_id', 'edit_var');
        expect(dialog).not.toBe(null);
      }));

      it("should update variable and close dialog", function() {
        fakeModal.close.calls.reset();
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(200, {test_guid: {}});
        var controller = new $controller(modelManager, fakeModal, dialogContext);
        controller.applyChange();
        $httpBackend.flush();
        expect(fakeModal.close).toHaveBeenCalled();
        expect(controller.addError).toBe(false);
      });

      it("should have error and not close dialog", function() {
        fakeModal.close.calls.reset();
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(400, {test_guid: {}});
        var controller = new $controller(modelManager, fakeModal, dialogContext);
        controller.applyChange();
        $httpBackend.flush();
        expect(fakeModal.close).not.toHaveBeenCalled();
        expect(controller.addError).toBe(true);
      });
    });

    describe("delete", function() {
      var $httpBackend, appVarsManager;
      var APP_VAR_UPDATE = '/pp/v1/proxy/v2/apps/test_id';
      var okPromise = jasmine.createSpy('okPromise');
      var catchPromise = jasmine.createSpy('catchPromise');

      beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.expectPUT(APP_VAR_UPDATE);
        appVarsManager = $injector.get('cloud-foundry.view.applications.application.variables.manager');
      }));

      it("should delete variable", function() {
        okPromise.calls.reset();
        catchPromise.calls.reset();
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(200, {test_guid: {}});
        appVarsManager.delete('test_guid', 'test_id', 'edit_var').then(okPromise).catch(catchPromise);
        $httpBackend.flush();
        expect(okPromise).toHaveBeenCalled();
        expect(catchPromise).not.toHaveBeenCalled();
      });

      it("should not delete variable", function() {
        okPromise.calls.reset();
        catchPromise.calls.reset();
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(500, {test_guid: {}});
        appVarsManager.delete('test_guid', 'test_id', 'edit_var').then(okPromise).catch(catchPromise);
        $httpBackend.flush();
        expect(okPromise).not.toHaveBeenCalled();
        expect(catchPromise).toHaveBeenCalled();
      });

      it("should not delete variable (error code returned)", function() {
        okPromise.calls.reset();
        catchPromise.calls.reset();
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(200, {test_guid: {error_code: 'failed'}});
        appVarsManager.delete('test_guid', 'test_id', 'edit_var').then(okPromise).catch(catchPromise);
        $httpBackend.flush();
        expect(okPromise).not.toHaveBeenCalled();
        expect(catchPromise).toHaveBeenCalled();
      });
    });
  });
})();
