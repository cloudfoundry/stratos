(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.hce
   * @memberOf cloud-foundry.model
   * @name hce
   * @description Helion Code Engine model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerHceModel);

  registerHceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerHceModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.hce', new HceModel(apiManager));
  }

  /**
   * @memberof cloud-foundry.model.hce
   * @name HceModel
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {object} data - the Helion Code Engine data
   * @class
   */
  function HceModel(apiManager) {
    this.apiManager = apiManager;
    this.data = {
      buildContainers: [],
      deploymentTargets: [],
      imageRegistries: [],
      user: {}
    };
  }

  angular.extend(HceModel.prototype, {

    /**
     * @function getBuildContainers
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get registered build container instances
     * @returns {promise} A promise object
     * @public
     **/
    getBuildContainers: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.HceContainerApi')
        .getBuildContainers()
        .then(function (response) {
          that.onGetBuildContainers(response);
        });
    },

    /**
     * @function getDeploymentTargets
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get registered deployment targets
     * @returns {promise} A promise object
     * @public
     **/
    getDeploymentTargets: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.HceDeploymentApi')
        .getDeploymentTargets({ user_id: this.data.user.id })
        .then(function (response) {
          that.onGetDeploymentTargets(response);
        });
    },

    /**
     * @function getImageRegistries
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get registered image registries
     * @returns {promise} A promise object
     * @public
     **/
    getImageRegistries: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.HceContainerApi')
        .getImageRegistries()
        .then(function (response) {
          that.onGetImageRegistries(response);
        });
    },

    /**
     * @function getUser
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get user by ID
     * @param {number} userId - the user's ID
     * @returns {promise} A promise object
     * @public
     **/
    getUser: function (userId) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.HceUserApi')
        .getUser(userId)
        .then(function (response) {
          that.onGetUser(response);
        });
    },

    /**
     * @function createDeploymentTarget
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Create a new deployment target
     * @param {string} name - the user-provided label for this target
     * @param {string} url - the URL endpoint that the target is accessible at
     * @param {string} username - the username to authenticate the target with
     * @param {string} password - the password to authenticate the target with
     * @param {string} org - the organization under which a project will be deployed to this target
     * @param {string} space - the space within an organization that a project will be deployed under on this target
     * @param {string} targetType - the type of deployment target (e.g. cloudfoundry, aws)
     * @returns {promise} A promise object
     * @public
     */
    createDeploymentTarget: function (name, url, username, password, org, space, targetType) {
      var that = this;
      var newTarget = {
        user_id: this.data.user.id,
        name: name,
        url: url,
        userName: username,
        password: password,
        organization: org,
        space: space,
        type: targetType || 'cloudfoundry'
      };

      return this.apiManager.retrieve('cloud-foundry.api.HceDeploymentApi')
        .addDeploymentTarget(newTarget)
        .then(function (response) {
          return that.onCreateDeploymentTarget(response);
        });
    },

    /**
     * @function createProject
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Create a new project
     * @param {string} name - the project name
     * @param {string} vcs - the VCS type
     * @param {string} vcsToken - the VCS token
     * @param {number} targetId - the deployment target ID
     * @param {string} type - the platform type of the project (e.g. java, nodejs)
     * @param {number} buildContainerId - the build container ID
     * @param {object} repo - the repo to use
     * @param {string} branch - the branch to use
     * @returns {promise} A promise object
     * @public
     */
    createProject: function (name, vcs, vcsToken, targetId, type, buildContainerId, repo, branch) {
      var newProject = {
        name: name,
        type: type,
        user_id: this.data.user.id,
        build_container_id: buildContainerId,
        token: vcsToken,
        branchRefName: branch,
        repo: {
          vcs: vcs || 'github',
          full_name: repo.full_name,
          owner: repo.owner.login,
          name: repo.name,
          githubRepoId: repo.id,
          branch: branch,
          cloneUrl: repo.clone_url,
          sshUrl: repo.ssh_url,
          httpUrl: repo.html_url
        },
        deployment_target_id: targetId
      };

      return this.apiManager.retrieve('cloud-foundry.api.HceProjectApi')
        .createProject(newProject);
    },

    /**
     * @function createUser
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Create a new HCE user
     * @param {string} userId - the user ID
     * @param {string} login - the user login name
     * @param {string} token - the login token
     * @param {string} vcs - the version control system (e.g. github)
     * @returns {promise} A promise object
     * @public
     */
    createUser: function (userId, login, token, vcs) {
      var that = this;
      var newUser = {
        userId: userId,
        login: login,
        vcs: vcs || 'github',
        secret: token
      };

      return this.apiManager.retrieve('cloud-foundry.api.HceUserApi')
        .createUser(newUser)
        .then(function (response) {
          return that.onCreateUser(response);
        });
    },

    /**
     * @function onGetBuildContainers
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache build container
     * @param {string} response - the JSON response from API call
     * @private
     */
    onGetBuildContainers: function (response) {
      this.data.buildContainers.length = 0;
      [].push.apply(this.data.buildContainers, response.data || []);
    },

    /**
     * @function onGetDeploymentTargets
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache deployment targets
     * @param {string} response - the JSON response from API call
     * @private
     */
    onGetDeploymentTargets: function (response) {
      this.data.deploymentTargets.length = 0;
      [].push.apply(this.data.deploymentTargets, response.data || []);
    },

    /**
     * @function onGetImageRegistries
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache image registries
     * @param {string} response - the JSON response from API call
     * @private
     */
    onGetImageRegistries: function (response) {
      this.data.imageRegistries.length = 0;
      [].push.apply(this.data.imageRegistries, response.data || []);
    },

    /**
     * @function onGetUser
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache user
     * @param {string} response - the JSON response from API call
     * @private
     */
    onGetUser: function (response) {
      var user = response.data;
      delete user.secret;
      this.data.user = user;
    },

    /**
     * @function onCreateDeploymentTarget
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache deployment target
     * @param {string} response - the JSON response from API call
     * @returns {object} The new deployment target data
     * @private
     */
    onCreateDeploymentTarget: function (response) {
      var target = response.data;
      delete target.userName;       // don't save user login name
      delete target.password;       // don't save user password
      this.data.deploymentTargets.push(target);

      return target;
    },

    /**
     * @function onCreateUser
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache user
     * @param {string} response - the JSON response from API call
     * @returns {object} The new user data
     * @private
     */
    onCreateUser: function (response) {
      var newUser = response.data;
      delete newUser.secret;
      this.data.user = newUser;

      return newUser;
    }

  });

})();
