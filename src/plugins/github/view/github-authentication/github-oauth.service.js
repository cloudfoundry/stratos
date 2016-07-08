(function () {
  'use strict';

  angular
    .module('github.view')
    .factory('github.view.githubOauthService', githubOauthServiceFactory);

  githubOauthServiceFactory.$inject = [
    '$window',
    '$q'
  ];

  /**
   * @memberof github.view
   * @name githubOauthServiceFactory
   * @constructor
   * @param {object} $window - angular $window service
   * @param {object} $q - angular $q service
   */
  function githubOauthServiceFactory($window, $q) {
    return new GithubOauthService($window, $q);
  }

  /**
   * @memberof github.view
   * @name GithubOauthService
   * @constructor
   * @param {object} $window - angular $window service
   * @param {object} $q - angular $q service
   * @property {object} $window - angular $window service
   * @property {object} $q - angular $q service
   */
  function GithubOauthService($window, $q) {
    this.$window = $window;
    this.$q = $q;
  }

  angular.extend(GithubOauthService.prototype, {
    start: function () {
      var that = this;
      var win = this.$window.open('/pp/v1/github/oauth/auth', '_blank');
      win.focus();

      return this.$q(function (resolve, reject) {
        that.$window.addEventListener('message', function (event) {
          var message = angular.fromJson(event.data);
          if (message.name === 'GitHub Oauth - token' && message.data && message.data.access_token) {
            resolve();
            win.close();
          } else {
            reject();
          }
        });
      });
    }
  });

})();
