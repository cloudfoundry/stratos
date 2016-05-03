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
    'app.api.apiManager',
    'app.event.eventService',
    '$q'
  ];

  function registerHceModel(modelManager, apiManager, eventService, $q) {
    modelManager.register('cloud-foundry.model.hce', new HceModel(apiManager, eventService, $q));
  }

  /**
   * @memberof cloud-foundry.model.hce
   * @name HceModel
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.event.eventService} eventService - the event bus service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.event.eventService} eventService - the event bus service
   * @property {object} data - the Helion Code Engine data
   * @class
   */
  function HceModel(apiManager, eventService, $q) {
    var that = this;
    this.$q = $q;
    this.apiManager = apiManager;
    this.eventService = eventService;
    this.data = {
      buildContainers: [],
      deploymentTargets: [],
      imageRegistries: [],
      projects: {},
      user: {}
    };

    this.eventService.$on(this.eventService.events.LOGOUT, function () {
      that.clear();
    });
  }

  angular.extend(HceModel.prototype, {

    /**
     * @function init
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Initialize the model data. This is
     * hardcoded for now until Github auth and HCE API
     * is finished.
     * @returns {void}
     * @public
     */
    init: function () {
      var deferred = this.$q.defer();

      // TODO: hardcoded values until HCE API is finished
      var that = this;
      this.getUser(5).then(function () {
        var promises = [];
        promises.push(that.getDeploymentTargets());
        promises.push(that.getProjects());
        that.$q.all(promises).then(function () {
          deferred.resolve();
        });
      }, function () {
        that.createUser('123456', 'owner', 'github-access-token')
          .then(function () {
            deferred.resolve();
          });
      });

      return deferred.promise;
    },

    /**
     * @function clear
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Clear the model data
     * @returns {void}
     * @public
     */
    clear: function () {
      this.data.buildContainers.length = 0;
      this.data.deploymentTargets.length = 0;
      this.data.imageRegistries.length = 0;
      this.data.projects = {};
      this.data.user = {};
    },

    /**
     * @function getBuildContainers
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get registered build container instances
     * @returns {promise} A promise object
     * @public
     */
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
     */
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
     */
    getImageRegistries: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.HceContainerApi')
        .getImageRegistries()
        .then(function (response) {
          that.onGetImageRegistries(response);
        });
    },

    /**
     * @function getNotificationTargets
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get notification targets for project
     * @param {number} projectId - the project ID to retrieve targets for
     * @returns {promise} A promise object
     * @public
     */
    getNotificationTargets: function (projectId) {
      return this.apiManager.retrieve('cloud-foundry.api.HceNotificationApi')
        .getNotificationTargets({ project_id: projectId });
    },

    /**
     * @function getProject
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get project by name
     * @param {string} name - the project name
     * @returns {promise} A promise object
     * @public
     */
    getProject: function (name) {
      return this.data.projects[name];
    },

    /**
     * @function getProjects
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get projects of user
     * @returns {promise} A promise object
     * @public
     */
    getProjects: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.HceProjectApi')
        .getProjects({ user_id: that.data.user.id })
        .then(function (response) {
          that.onGetProjects(response);
        });
    },

    /**
     * @function getUser
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get user by ID
     * @param {number} userId - the user's ID
     * @returns {promise} A promise object
     * @public
     */
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
     * @param {number} targetId - the deployment target ID
     * @param {string} type - the platform type of the project (e.g. java, nodejs)
     * @param {number} buildContainerId - the build container ID
     * @param {object} repo - the repo to use
     * @param {string} branch - the branch to use
     * @returns {promise} A promise object
     * @public
     */
    createProject: function (name, targetId, type, buildContainerId, repo, branch) {
      var that = this;
      var newProject = {
        name: name,
        type: type,
        user_id: this.data.user.id,
        build_container_id: buildContainerId,
        token: this.data.user.secret,
        branchRefName: branch,
        repo: repo,
        deployment_target_id: targetId
      };

      return this.apiManager.retrieve('cloud-foundry.api.HceProjectApi')
        .createProject(newProject)
        .then(function (response) {
          return that.onCreateProject(response);
        });
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
     * @function onGetProjects
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache user projects
     * @param {string} response - the JSON response from API call
     * @private
     */
    onGetProjects: function (response) {
      this.data.projects = _.keyBy(response.data, 'name') || {};
    },

    /**
     * @function onGetUser
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache user
     * @param {string} response - the JSON response from API call
     * @private
     */
    onGetUser: function (response) {
      this.data.user = response.data || {};
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
     * @function onCreateProject
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Cache new project
     * @param {string} response - the JSON response from API call
     * @returns {object} The new project data
     * @private
     */
    onCreateProject: function (response) {
      var project = response.data;
      delete project.token;
      this.data.projects[project.name] = project;

      return project;
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
      this.data.user = newUser || {};

      return newUser;
    }
  });

})();
