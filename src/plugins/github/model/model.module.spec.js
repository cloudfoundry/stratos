(function () {
  'use strict';

  /* eslint-disable angular/no-private-call */
  describe('github.model - ', function () {
    var that, $httpBackend, $rootScope;

    beforeEach(module('green-box-console'));

    beforeEach(module('cloud-foundry.view.applications.application.delivery-logs'));
    beforeEach(module('ng', function ($exceptionHandlerProvider) {
      // angular-mock implementation differs in the way it handles exceptions thrown by promises (it does not nicely
      // wrap them as per the actual implementation). Therefor disable so we can test error cases.
      // See stratos-ui/src/plugins/cloud-foundry/model/github/github.model.js +
      // http://stackoverflow.com/questions/31538364/promise-catch-does-not-catch-exception-in-angularjs-unit-test
      $exceptionHandlerProvider.mode('log');
    }));

    beforeEach(inject(function ($injector) {
      var modelManager = $injector.get('modelManager');
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      that = modelManager.retrieve('github.model');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(that).toBeDefined();
    });

    it('should have right properties', function () {
      expect(that.repo).toEqual({
        filterTerm: null,
        page: 0,
        pageSize: 50,
        links: {}
      });
      expect(that.data).toEqual({
        repoLinks: {},
        repos: [],
        filteredRepos: [],
        branches: [],
        commits: []
      });
    });

    it('should have right interface', function () {
      expect(that.repos).toBeDefined();
      expect(that.filterRepos).toBeDefined();
      expect(that.nextRepos).toBeDefined();
      expect(that.branches).toBeDefined();
      expect(that.getBranch).toBeDefined();
      expect(that.commits).toBeDefined();
    });

    it('#repos() - ignore reset', function () {
      var ignoreReset = true;
      spyOn(that, '_resetRepos');
      spyOn(that, 'nextRepos').and.returnValue(that.$q.resolve());
      that.repos(ignoreReset, null);
      expect(that._resetRepos).not.toHaveBeenCalled();
      expect(that.nextRepos).toHaveBeenCalled();
    });

    it('#repos() - do not ignore reset', function () {
      var ignoreReset = false;
      spyOn(that, '_resetRepos');
      spyOn(that, 'nextRepos').and.returnValue(that.$q.resolve());
      that.repos(ignoreReset, null);
      expect(that._resetRepos).toHaveBeenCalled();
      expect(that.nextRepos).toHaveBeenCalled();
    });

    it('#repos() - response with failure', function () {
      spyOn(that, 'nextRepos').and.returnValue(that.$q.reject('error'));
      spyOn(that, 'onReposError');
      that.repos(true, null);
      $rootScope.$apply();
      expect(that.onReposError).toHaveBeenCalled();
    });

    describe('#filterRepos()', function () {
      it('when filterTerm is empty', function () {
        var filterTerm = '';
        that.filterRepos(filterTerm);
        expect(that.data.filteredRepos.length).toBe(0);
      });

      it('when filterTerm is not empty', function () {
        var filterTerm = 'n';
        that.repo.page = 1;
        that.repo.pageSize = 1;
        that.data.repos = [{ name: 'nodejs'}, { name: 'python'}, { name: 'ruby' }];
        that.filterRepos(filterTerm);
        expect(that.data.filteredRepos.length).toBe(2);
      });

      it('when filterTerm is not empty', function () {
        var filterTerm = 'n';
        that.repo.page = 1;
        that.repo.pageSize = 3;
        that.data.repos = [{ name: 'nodejs'}, { name: 'python'}, { name: 'ruby' }];
        that.filterRepos(filterTerm);
        expect(that.data.filteredRepos.length).toBe(2);
      });
    });

    describe('#nextRepos()', function () {
      it('response without data', function () {
        $httpBackend.whenGET('/pp/v1/vcs/user/repos?page=1&per_page=50').respond(); // <==
        $httpBackend.expectGET('/pp/v1/vcs/user/repos?page=1&per_page=50');
        var options = {};
        that.repo.links.next = { page: '1' };
        var promise = that.nextRepos(options);
        $httpBackend.flush();
        expect(promise.$$state.status).toBe(1);
        expect(promise.$$state.value).toEqual({
          newRepos: [],
          repos: [],
          links: {},
          page: 1
        });
      });

      it('response with data', function () {
        that.repo.filterTerm = '';
        $httpBackend.whenGET('/pp/v1/vcs/user/repos?page=1&per_page=50').respond(
          [ { permissions: { admin: true } } ]
        );
        $httpBackend.expectGET('/pp/v1/vcs/user/repos?page=1&per_page=50');
        var options = {};
        that.repo.links.next = { page: '1' };
        var promise = that.nextRepos(options);
        $httpBackend.flush();
        expect(promise.$$state.status).toBe(1);
        expect(promise.$$state.value).toEqual({
          newRepos: [
            { permissions: { admin: true } }
          ],
          repos: [
            { permissions: { admin: true } }
          ],
          links: {},
          page: 1
        });
      });

      it('response with data, with filter text', function () {
        that.repo.filterTerm = 'n';
        $httpBackend.whenGET('/pp/v1/vcs/user/repos?page=1&per_page=50').respond(
          [ { permissions: { admin: true } } ]
        );
        $httpBackend.expectGET('/pp/v1/vcs/user/repos?page=1&per_page=50');
        var options = {};
        that.repo.links.next = { page: '1' };
        var promise = that.nextRepos(options);
        $httpBackend.flush();
        expect(promise.$$state.status).toBe(1);
        expect(promise.$$state.value).toEqual({
          newRepos: [
            { permissions: { admin: true } }
          ],
          repos: [
            { permissions: { admin: true } }
          ],
          links: {},
          page: 1
        });
      });

      it('response failed', function () {
        $httpBackend.whenGET('/pp/v1/vcs/user/repos?per_page=50').respond(400, '');
        $httpBackend.expectGET('/pp/v1/vcs/user/repos?per_page=50');
        var options = {};
        var promise = that.nextRepos(options);
        $httpBackend.flush();
        expect(promise.$$state.status).toBe(2);
      });
    });

    it('#_resetRepos()', function () {
      that.data.repos.length = 1;
      that.repo.page = 1;
      that.repo.links = { foo: 'bar' };
      that._resetRepos();
      expect(that.data.repos.length).toBe(0);
      expect(that.repo.page).toBe(0);
      expect(that.repo.links).toEqual({});
    });

    describe('#branches()', function () {
      it('response success', function () {
        var githubApi = that.apiManager.retrieve('github.api');
        spyOn(githubApi, 'branches').and.returnValue(that.$q.resolve({
          data: [{}, {}]
        }));
        spyOn(that, 'onBranchesError');
        that.branches('my-repo', {});
        $rootScope.$apply();
        expect(that.onBranchesError).not.toHaveBeenCalled();
      });

      it('response failed', function () {
        var githubApi = that.apiManager.retrieve('github.api');
        spyOn(githubApi, 'branches').and.returnValue(that.$q.reject());
        spyOn(that, 'onBranchesError');
        that.branches('my-repo', {});
        $rootScope.$apply();
        expect(that.onBranchesError).toHaveBeenCalled();
      });
    });

    it('#getBranch()', function () {
      var githubApi = that.apiManager.retrieve('github.api');
      spyOn(githubApi, 'getBranch');
      that.getBranch('foo,', 'bar', {});
      expect(githubApi.getBranch).toHaveBeenCalled();
    });

    it('#commits() - success - 1', function () {
      var githubApi = that.apiManager.retrieve('github.api');
      spyOn(githubApi, 'commits').and.returnValue(that.$q.resolve({ data: {}}));
      spyOn(that, 'onCommits');
      spyOn(that, 'onCommitsError');
      that.commits('foo,', 'bar', 1, {});
      $rootScope.$apply();
      expect(githubApi.commits).toHaveBeenCalled();
      expect(that.onCommits).toHaveBeenCalled();
      expect(that.onCommitsError).not.toHaveBeenCalled();
    });

    it('#commits() - success - 2', function () {
      var githubApi = that.apiManager.retrieve('github.api');
      spyOn(githubApi, 'commits').and.returnValue(that.$q.resolve({ data: {}}));
      spyOn(that, 'onCommits');
      spyOn(that, 'onCommitsError');
      that.commits('foo,', undefined, undefined, {});
      $rootScope.$apply();
      expect(githubApi.commits).toHaveBeenCalled();
      expect(that.onCommits).toHaveBeenCalled();
      expect(that.onCommitsError).not.toHaveBeenCalled();
    });

    it('#commits() - failed', function () {
      var githubApi = that.apiManager.retrieve('github.api');
      spyOn(githubApi, 'commits').and.returnValue(that.$q.reject());
      spyOn(that, 'onCommits');
      spyOn(that, 'onCommitsError');
      that.commits('foo,', 'bar', 1, {});
      $rootScope.$apply();
      expect(githubApi.commits).toHaveBeenCalled();
      expect(that.onCommits).not.toHaveBeenCalled();
      expect(that.onCommitsError).toHaveBeenCalled();
    });

    it('#onBranches() - no data in response', function () {
      var length = that.data.branches.length;
      that.onBranches({});
      expect(that.data.branches.length).toBe(length);
    });

    it('#onBranches() - with data in response', function () {
      var length = that.data.branches.length;
      that.onBranches({ data: [{}, {}] });
      expect(that.data.branches.length).toBe(length + 2);
    });

    it('#onCommits() - with data in response', function () {
      that.data.commits.length = 1;
      that.onCommits({});
      expect(that.data.commits.length).toBe(0);
    });

    it('#onCommits() - with data in response', function () {
      that.data.commits.length = 0;
      that.onCommits({ data: [{}, {}] });
      expect(that.data.commits.length).toBe(2);
    });

    it('#onReposError()', function () {
      spyOn(that, '_resetRepos');
      that.onReposError();
      expect(that._resetRepos).toHaveBeenCalled();
    });

    it('#onBranchesError()', function () {
      expect(that.onBranchesError()).toBeUndefined();
    });

    it('#onCommitsError()', function () {
      that.data.commits.length = 1;
      that.onCommitsError();
      expect(that.data.commits.length).toBe(0);
    });
  });
  /* eslint-enable angular/no-private-call */
})();
