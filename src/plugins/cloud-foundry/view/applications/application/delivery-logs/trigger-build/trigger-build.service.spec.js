(function () {
  'use strict';

  describe('variables manager service', function () {
    var promise, dialogContext, $controller, $q, modelManager, $httpBackend, $uibModalInstance, githubModel,
      githubOauthService, $timeout;

    var cnsi = 1234;
    var project = {
      repo: {
        full_name: 'test_full_name'
      }
    };
    var defaultCommitCount = 20;
    var defaultCommitsRequest = '/pp/v1/github/repos/' + project.repo.full_name + '/commits?per_page=' +
      defaultCommitCount;
    var defaultTriggerRequest = '/pp/v1/proxy/v2/pipelines/triggers';
    var defaultCommit = {
      sha: '1234'
    };

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry.view.applications.application.delivery-logs'));
    beforeEach(module('ng', function ($exceptionHandlerProvider) {
      // angular-mock implementation differs in the way it handles exceptions thrown by promises (it does not nicely
      // wrap them as per the actual implementation). Therefor disable so we can test error cases.
      // See stratos-ui/src/plugins/cloud-foundry/model/github/github.model.js +
      // http://stackoverflow.com/questions/31538364/promise-catch-does-not-catch-exception-in-angularjs-unit-test
      $exceptionHandlerProvider.mode('log');
    }));

    beforeEach(module(function ($provide) {
      var mock = function (config, context) {
        dialogContext = context;
        $controller = config.controller;
        return $q.reject();
      };
      $provide.value('helion.framework.widgets.detailView', mock);
    }));

    beforeEach(inject(function ($injector, $rootScope, _$httpBackend_, _$q_, _$timeout_) {
      $httpBackend = _$httpBackend_;
      $q = _$q_;
      $timeout = _$timeout_;

      modelManager = $injector.get('app.model.modelManager');

      $uibModalInstance = jasmine.createSpyObj('$uibModalInstance', ['close', 'dismiss']);
      githubModel = modelManager.retrieve('cloud-foundry.model.github');
      githubOauthService = $injector.get('github.view.githubOauthService');

      var triggerBuild = $injector.get('triggerBuildDetailView');
      promise = triggerBuild.open(project, cnsi);
      expect(promise).not.toBe(null);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Factory', function () {

      describe("open", function () {
        it("Plumbing / Initial state", function () {
          /* eslint-disable */
          new $controller($timeout, $uibModalInstance, dialogContext, undefined, modelManager,
            githubOauthService);
          /* eslint-enable */
          expect(dialogContext.project).toEqual(project);
          expect(dialogContext.guid).toEqual(cnsi);
        });
      });
    });

    describe('Controller', function () {
      var controller;

      beforeEach(function () {
        controller = new $controller($timeout, $uibModalInstance, dialogContext, undefined, modelManager,
          githubOauthService);
        expect(controller).toBeDefined();
        expect(controller.selectedCommit).not.toBeDefined();
        expect(controller.fetchError).not.toBeDefined();
        expect(controller.triggerError).toBeFalsy();
      });

      describe('github token', function () {
        // Once the github token side of things has settled down these will need updating
      });

      describe('list commits', function () {

        function setGithubToken() {
          // Calls to githubModel will fail before the http request if token.access_token is missing
          _.set(githubModel.apiManager.retrieve('cloud-foundry.api.github'), 'authenticated', true);
          expect(githubModel.isAuthenticated()).toBe(true);
        }

        it('Don\'t fetch if no token present', function () {
          spyOn(githubModel, 'commits').and.callThrough();
          controller.fetchCommits();
          expect(githubModel.commits).not.toHaveBeenCalled();
          // No requests should ha
        });

        it('Fetch empty commit list', function () {

          setGithubToken();

          $httpBackend.expectGET(defaultCommitsRequest).respond([]);
          controller.fetchCommits();
          $httpBackend.flush();

          // Nothing in list, selected commit should be null
          expect(controller.selectedCommit).toBeNull();
          expect(controller.fetchError).toBeFalsy();
          expect(controller.triggerError).toBeFalsy();
        });

        it('Fetch populated commit list', function () {

          setGithubToken();

          $httpBackend.expectGET(defaultCommitsRequest).respond([defaultCommit, {}, {}, {}]);

          controller.fetchCommits();
          $httpBackend.flush();

          // List populated, selected commit should be the first one
          expect(controller.selectedCommit).toEqual(defaultCommit);
          expect(controller.fetchError).toBeFalsy();
          expect(controller.triggerError).toBeFalsy();
        });

        it('Fetch error', function () {

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

      describe('build', function () {

        beforeEach(function () {
          controller.selectedCommit = defaultCommit;
        });

        it('Basic successful trigger', function () {
          $httpBackend.expectPOST(defaultTriggerRequest, {commit_ref: defaultCommit.sha}).respond();
          controller.build();
          $httpBackend.flush();
          expect($uibModalInstance.close).toHaveBeenCalled();
          expect($uibModalInstance.dismiss).not.toHaveBeenCalled();
          expect(controller.fetchError).toBeFalsy();
          expect(controller.triggerError).toBeFalsy();
        });

        it('Basic failed trigger', function () {
          $httpBackend.expectPOST(defaultTriggerRequest, {commit_ref: defaultCommit.sha}).respond(500);
          controller.build();
          $httpBackend.flush();
          expect($uibModalInstance.close).not.toHaveBeenCalled();
          expect($uibModalInstance.dismiss).not.toHaveBeenCalled();
          expect(controller.fetchError).toBeFalsy();
          expect(controller.triggerError).toBeTruthy();
        });

      });
    });
  });
})();
