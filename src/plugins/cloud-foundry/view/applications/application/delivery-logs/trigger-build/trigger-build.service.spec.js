(function () {
  'use strict';

  describe('trigger build service', function () {
    var promise, dialogContext, $controller, $q, modelManager, vcsTokenManager, hceModel, $httpBackend, $uibModalInstance, $timeout;

    var cnsi = 1234;
    var project = {
      id: 1234,
      repo: {
        full_name: 'test_full_name',
        http_url: 'https://github.com'
      }
    };
    var vcsInstance = {
      browse_url: 'https://github.com',
      api_url: 'https://api.github.com'
    };
    var defaultCommitCount = 20;
    var defaultCommitsRequest = '/pp/v1/vcs/repos/' + project.repo.full_name + '/commits?per_page=' +
      defaultCommitCount;
    var defaultTriggerRequest = '/pp/v1/proxy/v2/pipelines/triggers';
    var defaultUpdateProjectRequest = '/pp/v1/proxy/v2/projects/1234';
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
      vcsTokenManager = $injector.get('app.view.vcs.manageVcsTokens');
      hceModel = modelManager.retrieve('cloud-foundry.model.hce');
      hceModel.data.vcsInstance = vcsInstance;

      $uibModalInstance = jasmine.createSpyObj('$uibModalInstance', ['close', 'dismiss']);

      var triggerBuild = $injector.get('triggerBuildDetailView');
      promise = triggerBuild.open(project, cnsi);
      expect(promise).not.toBe(null);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Factory', function () {

      describe('open', function () {
        it('Plumbing / Initial state', function () {
          /* eslint-disable no-new */
          new $controller($timeout, $uibModalInstance, $q, vcsTokenManager, dialogContext, undefined, modelManager);
          /* eslint-enable no-new */
          expect(dialogContext.project).toEqual(project);
          expect(dialogContext.guid).toEqual(cnsi);
        });
      });
    });

    describe('Controller', function () {
      var controller;

      beforeEach(function () {
        // $timeout, $uibModalInstance, $q, vcsTokenManager, context, content, modelManager
        controller = new $controller($timeout, $uibModalInstance, $q, vcsTokenManager, dialogContext, undefined, modelManager);
        expect(controller).toBeDefined();
        expect(controller.selectedCommit).not.toBeDefined();
        expect(controller.fetchError).not.toBeDefined();
        expect(controller.triggerError).toBeFalsy();
      });

      describe('github token', function () {
        // Once the github token side of things has settled down these will need updating
      });

      describe('list commits', function () {
        it('Fetch empty commit list', function () {
          $httpBackend.expectGET(defaultCommitsRequest).respond([]);
          controller.fetchCommits();
          $httpBackend.flush();

          // Nothing in list, selected commit should be null
          expect(controller.selectedCommit).toBeNull();
          expect(controller.fetchError).toBeFalsy();
          expect(controller.triggerError).toBeFalsy();
        });

        it('Fetch populated commit list', function () {
          $httpBackend.expectGET(defaultCommitsRequest).respond([defaultCommit, {}, {}, {}]);

          controller.fetchCommits();
          $httpBackend.flush();

          // List populated, selected commit should be the first one
          expect(controller.selectedCommit).toEqual(defaultCommit);
          expect(controller.fetchError).toBeFalsy();
          expect(controller.triggerError).toBeFalsy();
        });

        it('Fetch error', function () {
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
          $httpBackend.expectPOST(defaultTriggerRequest, {project_id: 1234, commit_ref: defaultCommit.sha}).respond(200);

          controller.build().then(function () {
            expect($uibModalInstance.close).toHaveBeenCalled();
            expect($uibModalInstance.dismiss).not.toHaveBeenCalled();
            expect(controller.triggerError).toBeFalsy();
          });

          $httpBackend.flush();
        });

        it('Basic failed trigger', function () {
          dialogContext.project.id = 1234;
          $httpBackend.expectPOST(defaultTriggerRequest, {project_id: 1234, commit_ref: defaultCommit.sha}).respond(500);

          controller.build().then(function () {
            $httpBackend.flush();

            expect($uibModalInstance.close).not.toHaveBeenCalled();
            expect($uibModalInstance.dismiss).not.toHaveBeenCalled();
            expect(controller.triggerError).toBeTruthy();
            expect(controller.triggering).toBeFalsy();
          });

          expect(controller.triggering).toBeTruthy();

          $httpBackend.flush();
        });

      });
    });
  });
})();
