(function () {
  'use strict';

  describe('Add-post-deploy-action', function () {
    var hceCnsi, hceProjectId, postDeployActionFactory, data, $httpBackend;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'helion.framework.widgets.asyncTaskDialog': function (content, context, actionTask) {
        return {
          content: content,
          context: context,
          actionTask: actionTask
        };
      }
    }));

    beforeEach(inject(function ($injector) {
      postDeployActionFactory = $injector.get('cloud-foundry.view.applications.application.delivery-pipeline.postDeployActionService');
      $httpBackend = $injector.get('$httpBackend');

      data = {
        userName: 'testUser',
        password: 'testPassword',
        testId: 'test1',
        tenantId: 'tenant1',
        projectId: 'project1',
        actionName: 'myAction'
      };

      hceCnsi = 'randomCNSI';
      hceProjectId = '2';

    }));

    it('should be defined', function () {
      expect(postDeployActionFactory).toBeDefined();
    });

    it('should pass correct content spec to asyncTaskDialog', function () {
      var modalObj = postDeployActionFactory.add(hceCnsi, hceProjectId);
      expect(modalObj.content.title).toBeDefined();
      expect(modalObj.content.templateUrl).toBeDefined();
      expect(modalObj.content.buttonTitles.submit).toBeDefined();
    });

    it('should make the expected requests to HCE', function () {

      var modalObj = postDeployActionFactory.add(hceCnsi, hceProjectId);

      var expectedAuthRequest = {
        credential_type: 'USERNAME_PASSWORD',
        credential_key: data.userName,
        credential_value: data.password
      };

      $httpBackend.expectPOST('/pp/v1/proxy/v2/auth/credentials', expectedAuthRequest)
        .respond(200, {credential_id: 2});

      var addPipelineRequest = {
        task_type: 'stormrunner',
        task_label: data.actionName,
        project_id: hceProjectId,
        credential_id: 2,
        metadata: angular.toJson({
          storm_runner_tenant_id: data.tenantId,
          storm_runner_test_id: data.testId,
          storm_runner_project_id: data.projectId
        })
      };

      $httpBackend.expectPOST('/pp/v1/proxy/v2/pipelines/tasks', addPipelineRequest)
        .respond(200, {});

      modalObj.actionTask(data);
      $httpBackend.flush();

    });

  });

})();
