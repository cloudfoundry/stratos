(function () {
  'use strict';

  angular
    .module('github.api', [])
    .run(registerGithubApi);

  registerGithubApi.$inject = [
    '$http',
    'app.api.apiManager',
    'GITHUB_ENDPOINTS'
  ];

  function registerGithubApi($http, apiManager, GITHUB_ENDPOINTS) {
    apiManager.register('github.api', new GithubApi($http, GITHUB_ENDPOINTS));
  }

  /**
   * @memberof cloud-foundry.api.github
   * @name GithubApi
   * @param {object} $http - the Angular $http service
   * @param {GITHUB_ENDPOINTS} GITHUB_ENDPOINTS - the public Github Endpoints
   * @property {object} $http - the Angular $http service
   * @property {GITHUB_ENDPOINTS} GITHUB_ENDPOINTS - the public Github Endpoints
   * @property {string} githubApiUrl - the Github API endpoint
   * @class
   */
  function GithubApi($http, GITHUB_ENDPOINTS) {
    this.$http = $http;
    this.GITHUB_ENDPOINTS = GITHUB_ENDPOINTS;
    this.githubApiUrl = '/pp/v1/vcs/';
  }

  angular.extend(GithubApi.prototype, {
    /**
     * @function repos
     * @memberof cloud-foundry.api.github.GithubApi
     * @description Get repos user owns or has admin rights to
     * @param {object} params - additional params to send
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
    */
    repos: function (params, options) {
      var url = this.githubApiUrl + 'user/repos';
      return this.$http.get(url, this._buildRequest(params, options));
    },

    /**
     * @function branches
     * @memberof cloud-foundry.api.github.GithubApi
     * @description Get branches a repo
     * @param {string} repo - the repo full name
     * @param {object} params - additional params to send
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    branches: function (repo, params, options) {
      var url = this.githubApiUrl + 'repos/' + repo + '/branches';
      return this.$http.get(url, this._buildRequest(params, options));
    },

    /**
     * @function getBranch
     * @memberof cloud-foundry.api.github.GithubApi
     * @description Get specified branch
     * @param {string} repo - the repo full name
     * @param {string} branch - the branch name
     * @param {object} params - additional params to send
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    getBranch: function (repo, branch, params, options) {
      var url = this.githubApiUrl + 'repos/' + repo + '/branches/' + branch;
      return this.$http.get(url, this._buildRequest(params, options));
    },

    /**
     * @function commits
     * @memberof cloud-foundry.api.github.GithubApi
     * @description Get commits for a repo
     * @param {string} repo - the repo full name
     * @param {object} params - additional params to send
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    commits: function (repo, params, options) {
      var url = this.githubApiUrl + 'repos/' + repo + '/commits';
      return this.$http.get(url, this._buildRequest(params, options));
    },

    /**
     * @function _buildRequest
     * @memberof cloud-foundry.api.github.GithubApi
     * @description Build and return the Github API request
     * @param {object} params - additional params to send
     * @param {object} options - additional options to send
     * @returns {object} The request
     * @private
     */
    _buildRequest: function (params, options) {
      var config = {
        params: params || {},
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache'
        }
      };

      if (!_.isNil(options)) {
        angular.forEach(options, function (optionConfig, option) {
          if (option === 'headers') {
            angular.extend(config[option], optionConfig);
          } else if (option !== 'params') {
            config[option] = optionConfig;
          }
        });
      }

      return config;
    }
  });

})();
