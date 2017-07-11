(function () {
  'use strict';

  describe('variables manager service', function () {
    var $q, modelManager, dialogContext, dialogPromise, applyChange;

    beforeEach(module('console-app'));
    beforeEach(module({
      frameworkAsyncTaskDialog: function (content, context, actionTask) {
        dialogContext = context;
        applyChange = actionTask;
        return {
          result: $q.defer().promise
        };
      }
    }));

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      modelManager = $injector.get('modelManager');
      var appModel = modelManager.retrieve('cloud-foundry.model.application');
      appModel.application.variables = {
        environment_json: {
          edit_var: 'edit_value',
          add_var: 'add_value',
          three_var: '3value'
        }
      };
    }));

    describe('add', function () {
      beforeEach(inject(function ($injector) {
        var appVarsManager = $injector.get('cfVariablesManager');
        dialogPromise = appVarsManager.add('test_guid', 'test_id');
        expect(dialogPromise).toBeDefined();
      }));

      it('check var name and value are empty', function () {
        expect(dialogContext.data.varName).toBe('');
        expect(dialogContext.data.varValue).toBe('');
        expect(dialogContext.isEdit).toBe(false);
      });
    });

    describe('edit', function () {
      beforeEach(inject(function ($injector) {
        var appVarsManager = $injector.get('cfVariablesManager');
        dialogPromise = appVarsManager.edit('test_guid', 'test_id', 'edit_var');
        expect(dialogPromise).toBeDefined();
      }));
      it('check var name and value are not empty', function () {
        expect(dialogContext.data.varName).toBe('edit_var');
        expect(dialogContext.data.varValue).toBe('edit_value');
        expect(dialogContext.isEdit).toBe(true);
      });
    });

    describe('apply changes', function () {
      var APP_VAR_UPDATE = '/pp/v1/proxy/v2/apps/test_id';
      var $httpBackend;

      beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.expectPUT(APP_VAR_UPDATE);
        var appVarsManager = $injector.get('cfVariablesManager');
        dialogPromise = appVarsManager.edit('test_guid', 'test_id', 'edit_var');
        expect(dialogPromise).toBeDefined();
      }));

      it('should update variable and close dialog', function () {
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(200, {test_guid: {}});
        applyChange({}).catch(function () {
          fail('applyChange func should not fail');
        });
      });

      it('should have error and not close dialog', function () {
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(400, {test_guid: {}});
        applyChange({}).then(function () {
          fail('applyChange func should not pass');
        });
      });
    });

    describe('delete', function () {
      var $httpBackend, appVarsManager;
      var APP_VAR_UPDATE = '/pp/v1/proxy/v2/apps/test_id';
      var okPromise = jasmine.createSpy('okPromise');
      var catchPromise = jasmine.createSpy('catchPromise');

      beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.expectPUT(APP_VAR_UPDATE);
        appVarsManager = $injector.get('cfVariablesManager');
      }));

      it('should delete variable', function () {
        okPromise.calls.reset();
        catchPromise.calls.reset();
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(200, {});
        appVarsManager.delete('test_guid', 'test_id', 'edit_var').then(okPromise).catch(catchPromise);
        $httpBackend.flush();
        expect(okPromise).toHaveBeenCalled();
        expect(catchPromise).not.toHaveBeenCalled();
      });

      it('should not delete variable', function () {
        okPromise.calls.reset();
        catchPromise.calls.reset();
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(500, {});
        appVarsManager.delete('test_guid', 'test_id', 'edit_var').then(okPromise).catch(catchPromise);
        $httpBackend.flush();
        expect(okPromise).not.toHaveBeenCalled();
        expect(catchPromise).toHaveBeenCalled();
      });

      it('should not delete variable (error code returned)', function () {
        okPromise.calls.reset();
        catchPromise.calls.reset();
        $httpBackend.when('PUT', APP_VAR_UPDATE).respond(200, {error_code: 'failed'});
        appVarsManager.delete('test_guid', 'test_id', 'edit_var').then(okPromise).catch(catchPromise);
        $httpBackend.flush();
        expect(okPromise).not.toHaveBeenCalled();
        expect(catchPromise).toHaveBeenCalled();
      });
    });
  });
})();
