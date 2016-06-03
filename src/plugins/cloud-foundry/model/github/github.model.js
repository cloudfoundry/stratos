(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.github
   * @memberOf cloud-foundry.model
   * @name github
   * @description Github model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerGithubModel);

  registerGithubModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerGithubModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.github', new GithubModel(apiManager));
  }

  /**
   * @memberof cloud-foundry.model.github
   * @name GithubModel
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {object} data - the Github data
   * @class
   */
  function GithubModel(apiManager) {
    this.apiManager = apiManager;
    this.data = {
      repos: [],
      branches: [],
      commits: []
    };
  }

  angular.extend(GithubModel.prototype, {

    getToken: function () {
      return this.apiManager.retrieve('cloud-foundry.api.github').token;
    },

    /**
     * @function repos
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get repos user owns or has admin rights to
     * @returns {promise} A promise object
     * @public
     */
    repos: function () {
      var that = this;
      var githubApi = this.apiManager.retrieve('cloud-foundry.api.github');
      return githubApi.repos({ per_page: 100 })
        .then(function (response) {
          that.onRepos(response);
        }, function () {
          that.onReposError();
        });
    },

    /**
     * @function branches
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get branches for user's repository
     * @param {string} repo - the repo to get branches for
     * @returns {promise} A promise object
     * @public
     */
    branches: function (repo) {
      var that = this;
      var githubApi = this.apiManager.retrieve('cloud-foundry.api.github');
      return githubApi.branches(repo)
        .then(function (response) {
          that.onBranches(response);
        }, function () {
          that.onBranchesError();
        });
    },

    /**
     * @function getBranch
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get specified branch
     * @param {string} repo - the repo full name
     * @param {string} repo - the branch name
     * @returns {promise} A promise object
     * @public
     */
    getBranch: function (repo, branch) {
      var that = this;
      var githubApi = this.apiManager.retrieve('cloud-foundry.api.github');
      return githubApi.getBranch(repo, branch);
    },

    /**
     * @function commits
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get commits for a branch
     * @param {string} repo - the repo to get commits for
     * @param {string} branch - the branch to get commits for
     * @returns {promise} A promise object
     * @public
     */
    commits: function (repo, branch) {
      var that = this;
      var githubApi = this.apiManager.retrieve('cloud-foundry.api.github');
      return githubApi.commits(repo, branch)
        .then(function (response) {
          that.onCommits(response);
        }, function () {
          that.onCommitsError();
        });
    },

    /**
     * @function onRepos
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onRepos handler
     * @param {string} response - the JSON response from API call
     * @private
     */
    onRepos: function (response) {
      this.data.repos.length = 0;
      [].push.apply(this.data.repos, response.data || []);
    },

    /**
     * @function onBranches
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onBranches handler
     * @param {string} response - the JSON response from API call
     * @private
     */
    onBranches: function (response) {
      this.data.branches.length = 0;
      [].push.apply(this.data.branches, response.data || []);
    },

    /**
     * @function onCommits
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onCommits handler
     * @param {string} response - the JSON response from API call
     * @private
     */
    onCommits: function (response) {
      this.data.commits.length = 0;
      [].push.apply(this.data.commits, response.data || []);
    },

    /**
     * @function onReposError
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onReposError handler
     * @private
     */
    onReposError: function () {
      this.data.repos.length = 0;
    },

    /**
     * @function onBranchesError
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onBranchesError handler
     * @private
     */
    onBranchesError: function () {
      this.data.branches.length = 0;
    },

    /**
     * @function onCommitsError
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onCommitsError handler
     * @private
     */
    onCommitsError: function () {
      this.data.commits.length = 0;
    }
  });

})();
