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
    'app.api.apiManager',
    'app.event.eventService'
  ];

  function registerGithubApi($http, apiManager, eventService) {
    apiManager.register('cloud-foundry.api.github', new GithubApi($http, eventService));
  }

  /**
   * @memberof cloud-foundry.api.github
   * @name GithubApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function GithubApi($http, eventService) {
    var that = this;
    this.$http = $http;
    this.githubApiUrl = 'https://api.github.com/';
    this.token = null;

    // TODO (kdomico): Temporarily retrieve token from env variable in Node server
    eventService.$on(eventService.events.LOGIN, function () {
      that.$http.get('/api/gh/token')
        .then(function (response) {
          that.token = response.data.token;
        });
    });
  }

  angular.extend(GithubApi.prototype, {

   /**
    * @function repos
    * @memberof cloud-foundry.api.github.GithubApi
    * @description Get repos user owns or has admin rights to
    * @param {object} params - additional params to send
    * @returns {promise}
    * @public
    */
    repos: function (params) {
      var url = this.githubApiUrl + 'user/repos';
      var config = {
        params: params || {},
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: 'token ' + this.token
        }
      };

      return this.$http.get(url, config);
    },

    /**
    * @function branches
    * @memberof cloud-foundry.api.github.GithubApi
    * @description Get branches a repo
    * @param {string} repo - the repo full name
    * @param {object} params - additional params to send
    * @returns {promise}
    * @public
    */
    branches: function (repo, params) {
      var url = this.githubApiUrl + 'repos/' + repo + '/branches';
      var config = {
        params: params || {},
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: 'token ' + this.token
        }
      };

      return this.$http.get(url, config);
    },

    /**
    * @function commits
    * @memberof cloud-foundry.api.github.GithubApi
    * @description Get commits for a repo
    * @param {string} repo - the repo full name
    * @param {object} params - additional params to send
    * @returns {promise}
    * @public
    */
    commits: function (repo) {
      var url = this.githubApiUrl + 'repos/' + repo + '/commits';
      var config = {
        params: params || {},
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: 'token ' + this.token
        }
      };

      return this.$http.get(url, config);
    }
  });

})();
