(function () {
  'use strict';

  describe('Helion Code Engine model', function () {
    var $httpBackend, hceModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('getBuildContainers', function () {
      var getBuildContainers = mock.hceApi.HceContainerApi.getBuildContainers();

      $httpBackend.when('GET', getBuildContainers.url).respond(200, getBuildContainers.response['200'].body);
      $httpBackend.expectGET(getBuildContainers.url);
      hceModel.getBuildContainers();
      $httpBackend.flush();

      expect(hceModel.data.buildContainers.length).toBeGreaterThan(0);
      expect(hceModel.data.buildContainers[0].build_container_id).toBe(1);
      expect(hceModel.data.buildContainers[0].build_container_image_id).toBe(1);
      expect(hceModel.data.buildContainers[0].build_container_label).toBe('Python build container');
    });

    it('getImageRegistries', function () {
      var getImageRegistries = mock.hceApi.HceContainerApi.getImageRegistries();

      $httpBackend.when('GET', getImageRegistries.url).respond(200, getImageRegistries.response['200'].body);
      $httpBackend.expectGET(getImageRegistries.url);
      hceModel.getImageRegistries();
      $httpBackend.flush();

      expect(hceModel.data.imageRegistries.length).toBeGreaterThan(0);
      expect(hceModel.data.imageRegistries[0].image_registry_id).toBe(1);
      expect(hceModel.data.imageRegistries[0].image_type_id).toBe(1);
      expect(hceModel.data.imageRegistries[0].registry_url).toBe('https://index.docker.io/v1');
      expect(hceModel.data.imageRegistries[0].registry_label).toBe('DockerHub 1.0');
      expect(hceModel.data.imageRegistries[0].image_type).toBe('DOCKER');
    });

    it('getDeploymentTargets', function () {
      var getDeploymentTargets = mock.hceApi.HceDeploymentApi.getDeploymentTargets();

      $httpBackend.when('GET', getDeploymentTargets.url).respond(200, getDeploymentTargets.response['200'].body);
      $httpBackend.expectGET(getDeploymentTargets.url);
      hceModel.getDeploymentTargets();
      $httpBackend.flush();

      expect(hceModel.data.deploymentTargets.length).toBeGreaterThan(0);
      expect(hceModel.data.deploymentTargets[0].id).toBe(1);
      expect(hceModel.data.deploymentTargets[0].user_id).toBe(1);
      expect(hceModel.data.deploymentTargets[0].name).toBe('Deployment Target Name');
      expect(hceModel.data.deploymentTargets[0].url).toBe('http://www.example.com/');
      expect(hceModel.data.deploymentTargets[0].userName).toBe('username');
      expect(hceModel.data.deploymentTargets[0].password).toBe('password');
      expect(hceModel.data.deploymentTargets[0].organization).toBe('org 1');
      expect(hceModel.data.deploymentTargets[0].space).toBe('space 1');
      expect(hceModel.data.deploymentTargets[0].type).toBe('cloudfoundry');
    });

    it('getUser', function () {
      var getUser = mock.hceApi.HceUserApi.getUser(1);

      $httpBackend.when('GET', getUser.url).respond(200, getUser.response['200'].body);
      $httpBackend.expectGET(getUser.url);
      hceModel.getUser(1);
      $httpBackend.flush();

      expect(hceModel.data.user).not.toEqual({});
      expect(hceModel.data.user.id).toBe(1);
      expect(hceModel.data.user.userId).toBe('githubuser');
      expect(hceModel.data.user.login).toBe('user');
      expect(hceModel.data.user.vcs).toBe('github');
      expect(hceModel.data.user.secret).toBeUndefined();
    });

    it('createDeploymentTarget', function () {
      hceModel.data.user = { id: 1 };
      var addDeploymentTarget = mock.hceApi.HceDeploymentApi
                                  .addDeploymentTarget('name', 'url', 'username', 'password', 'org', 'space', 'cloudfoundry');

      $httpBackend.when('POST', addDeploymentTarget.url).respond(201, addDeploymentTarget.response['201'].body);
      $httpBackend.expectPOST(addDeploymentTarget.url);
      hceModel.createDeploymentTarget('name', 'url', 'username', 'password', 'org', 'space', 'cloudfoundry');
      $httpBackend.flush();

      expect(hceModel.data.deploymentTargets.length).toBe(1);
      expect(hceModel.data.deploymentTargets[0].user_id).toBe(1);
      expect(hceModel.data.deploymentTargets[0].name).toBe('name');
      expect(hceModel.data.deploymentTargets[0].url).toBe('url');
      expect(hceModel.data.deploymentTargets[0].username).toBeUndefined();
      expect(hceModel.data.deploymentTargets[0].password).toBeUndefined();
      expect(hceModel.data.deploymentTargets[0].organization).toBe('org');
      expect(hceModel.data.deploymentTargets[0].space).toBe('space');
      expect(hceModel.data.deploymentTargets[0].type).toBe('cloudfoundry');
    });

    it('createDeploymentTarget', function () {
      hceModel.data.user = { id: 1 };
      var addDeploymentTarget = mock.hceApi.HceDeploymentApi
                                  .addDeploymentTarget('name', 'url', 'username', 'password', 'org', 'space', 'cloudfoundry');

      $httpBackend.when('POST', addDeploymentTarget.url).respond(201, addDeploymentTarget.response['201'].body);
      $httpBackend.expectPOST(addDeploymentTarget.url);
      hceModel.createDeploymentTarget('name', 'url', 'username', 'password', 'org', 'space');
      $httpBackend.flush();

      expect(hceModel.data.deploymentTargets.length).toBe(1);
      expect(hceModel.data.deploymentTargets[0].type).toBe('cloudfoundry');
    });

    it('createProject', function () {
      hceModel.data.user = { id: 1 };
      var repo = {
        vcs: 'github',
        full_name: 'test_owner/test_repo',
        owner: 'test_owner',
        name: 'test_repo',
        githubRepoId: 300,
        branch: 'master',
        cloneUrl: 'https://github.com/test_owner/test_repo.git',
        sshUrl: 'git@github.com:test_owner/test_repo.git',
        httpUrl: 'https://github.com/test_owner/test_repo'
      };
      var createProject = mock.hceApi.HceProjectApi
                            .createProject('name', 'github', 'GithubToken', 1, 'java', 2, repo, 'master');

      $httpBackend.when('POST', createProject.url).respond(201, createProject.response['201'].body);
      $httpBackend.expectPOST(createProject.url);
      hceModel.createProject('name', 'github', 'GithubToken', 1, 'java', 2, repo, 'master');
      $httpBackend.flush();
    });

    it('createUser', function () {
      var createUser = mock.hceApi.HceUserApi.createUser(1, 'user', 'github', 'GithubToken');

      $httpBackend.when('POST', createUser.url).respond(201, createUser.response['201'].body);
      $httpBackend.expectPOST(createUser.url);
      hceModel.createUser(1, 'user', 'github', 'GithubToken');
      $httpBackend.flush();

      expect(hceModel.data.user).not.toEqual({});
      expect(hceModel.data.user.secret).toBeUndefined();
    });
  });

})();
