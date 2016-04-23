(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.api.github
   * @memberOf cloud-foundry.api
   * @name github
   * @description Github API
   */
  angular
    .module('cloud-foundry.api')
    .run(registerGithubApi);

  registerGithubApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerGithubApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.github', new GithubApi($http));
  }

  /**
   * @memberof cloud-foundry.api.github
   * @name GithubApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function GithubApi($http) {
    this.$http = $http;
  }

  angular.extend(GithubApi.prototype, {

   /**
    * @function repos
    * @memberof cloud-foundry.api.github.GithubApi
    * @description Get repos user owns or has admin rights to
    * @returns {promise}
    * @public
    */
    repos: function () {
      return this.$http.get('/api/gh/repos');
    },

    /**
    * @function branches
    * @memberof cloud-foundry.api.github.GithubApi
    * @description Get branches for user's repository
    * @param {string} repo - the repo to get branches for
    * @returns {promise}
    * @public
    */
    branches: function (repo) {
      return this.$http.get('/api/gh/repos/' + repo + '/branches');
    },

    /**
    * @function commits
    * @memberof cloud-foundry.api.github.GithubApi
    * @description Get commits for a branch
    * @param {string} repo - the repo to get commits for
    * @param {string} branch - the branch to get commits for
    * @returns {promise}
    * @public
    */
    commits: function (repo, branch) {
      return this.$http.get('/api/gh/repos/' + repo + '/' + branch + '/commits');
    }
  });

})();
