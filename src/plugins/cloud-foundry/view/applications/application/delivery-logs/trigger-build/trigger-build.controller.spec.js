(function () {
  'use strict';

  describe('Trigger Build', function () {

    var controller, $uibModalInstance, $httpBackend, githubModel, $scope;

    var defaultContext = {
      project: {
        repo: {
          full_name: 'test_full_name'
        }
      }
    };
    var defaultCommitCount = 20;
    var defaultCommitsRequest = 'https://api.github.com/repos/' + defaultContext.project.repo.full_name +
      '/commits?per_page=' + defaultCommitCount;
    var defaultTriggerRequest = '/pp/v1/proxy/v2/pipelines/triggers';
    var defaultToken = {
      access_token: 1234
    };
    var defaultCommit = {
      sha: '1234'
    };

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry.view.applications.application.delivery-logs'));
    beforeEach(module('app.model'));
    beforeEach(module('ng', function($exceptionHandlerProvider) {
      // angular-mock implementation differs in the way it handles exceptions thrown by promises (it does not nicely
      // wrap them as per the actual implementation). Therefor disable so we can test error cases.
      // See stratos-ui/src/plugins/cloud-foundry/model/github/github.model.js +
      // http://stackoverflow.com/questions/31538364/promise-catch-does-not-catch-exception-in-angularjs-unit-test
      $exceptionHandlerProvider.mode('log');
    }));

    beforeEach(inject(function ($rootScope, $injector, $controller) {
      $httpBackend = $injector.get('$httpBackend');
      $scope = $rootScope.$new();

      var modelManager = $injector.get('app.model.modelManager');

      $uibModalInstance = jasmine.createSpyObj('$uibModalInstance', ['close', 'dismiss']);
      githubModel = modelManager.retrieve('cloud-foundry.model.github');

      controller = $controller('triggerBuildsDetailViewController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        context: defaultContext,
        content: {},
        modelManager: modelManager
      });
      expect(controller).toBeDefined();
      expect(controller.selectedCommit).not.toBeDefined();
      expect(controller.fetchError).not.toBeDefined();
      expect(controller.triggerError).toBeFalsy();
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('github token', function() {
      // Once the github token side of things has settled down these will need updating
    });

    describe('list commits', function() {

      function setGithubToken() {
        // Calls to githubModel will fail before the http request if token.access_token is missing
        _.set(githubModel.apiManager.retrieve('cloud-foundry.api.github'), 'token', defaultToken);
        expect(githubModel.getToken()).toEqual(defaultToken.access_token);
        $scope.$digest();
      }

      it('Don\'t fetch if no token present', function() {
        spyOn(githubModel, 'commits').and.callThrough();
        controller.fetchCommits();
        expect(githubModel.commits).not.toHaveBeenCalled();
        // No requests should ha
      });

      it('Fetch empty commit list', function() {

        setGithubToken();

        $httpBackend.expectGET(defaultCommitsRequest).respond([]);
        controller.fetchCommits();
        $httpBackend.flush();

        // Nothing in list, selected commit should be null
        expect(controller.selectedCommit).toBeNull();
        expect(controller.fetchError).toBeFalsy();
        expect(controller.triggerError).toBeFalsy();
      });

      it('Fetch populated commit list', function() {

        setGithubToken();

        $httpBackend.expectGET(defaultCommitsRequest).respond([ defaultCommit, {}, {}, {} ]);

        controller.fetchCommits();
        $httpBackend.flush();

        // List populated, selected commit should be the first one
        expect(controller.selectedCommit).toEqual(defaultCommit);
        expect(controller.fetchError).toBeFalsy();
        expect(controller.triggerError).toBeFalsy();
      });

      it('Fetch error', function() {

        setGithubToken();

        $httpBackend.expectGET(defaultCommitsRequest).respond(500);

        controller.fetchCommits();
        expect(controller.fetchError).toBeFalsy();
        $httpBackend.flush();

        // List populated, selected commit should be the first one
        expect(controller.selectedCommit).not.toBeDefined();
        expect(controller.fetchError).toBeTruthy();
        expect(controller.triggerError).toBeFalsy();
      });

    });

    describe('build', function() {

      beforeEach(function () {
        controller.selectedCommit = defaultCommit;
      });

      it('Basic successful trigger', function() {
        $httpBackend.expectPOST(defaultTriggerRequest, { commit_ref: defaultCommit.sha }).respond();
        controller.build();
        $httpBackend.flush();
        expect($uibModalInstance.close).toHaveBeenCalled();
        expect($uibModalInstance.dismiss).not.toHaveBeenCalled();
        expect(controller.fetchError).toBeFalsy();
        expect(controller.triggerError).toBeFalsy();
      });

      it('Basic failed trigger', function() {
        $httpBackend.expectPOST(defaultTriggerRequest, { commit_ref: defaultCommit.sha }).respond(500);
        controller.build();
        $httpBackend.flush();
        expect($uibModalInstance.close).not.toHaveBeenCalled();
        expect($uibModalInstance.dismiss).not.toHaveBeenCalled();
        expect(controller.fetchError).toBeFalsy();
        expect(controller.triggerError).toBeTruthy();
      });

    });
  });

})();
