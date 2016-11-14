(function () {
  'use strict';

  angular
    .module('github.view')
    .factory('github.view.githubOauthService', githubOauthServiceFactory);

  githubOauthServiceFactory.$inject = [
    '$window',
    '$q',
    'GITHUB_ENDPOINTS',
    'app.event.eventService'
  ];

  /**
   * @memberof github.view
   * @name githubOauthServiceFactory
   * @constructor
   * @param {object} $window - angular $window service
   * @param {object} $q - angular $q service
   * @param {GITHUB_ENDPOINTS} GITHUB_ENDPOINTS - the public Github Endpoints
   * @param {app.event.eventService} eventService - the application event service
   */
  function githubOauthServiceFactory($window, $q, GITHUB_ENDPOINTS, eventService) {
    return new GithubOauthService($window, $q, GITHUB_ENDPOINTS, eventService);
  }

  /**
   * @memberof github.view
   * @name GithubOauthService
   * @constructor
   * @param {object} $window - angular $window service
   * @param {object} $q - angular $q service
   * @param {GITHUB_ENDPOINTS} GITHUB_ENDPOINTS - the public Github Endpoints
   * @param {app.event.eventService} eventService - the application event service
   * @property {object} $window - angular $window service
   * @property {object} $q - angular $q service
   * @property {GITHUB_ENDPOINTS} GITHUB_ENDPOINTS - the public Github Endpoints
   * @property {app.event.eventService} eventService - the application event service
   */
  function GithubOauthService($window, $q, GITHUB_ENDPOINTS, eventService) {
    this.$window = $window;
    this.$q = $q;
    this.GITHUB_ENDPOINTS = GITHUB_ENDPOINTS;
    this.eventService = eventService;
  }

  angular.extend(GithubOauthService.prototype, {
    start: function (endpoint, apiEndpoint) {
      var that = this;
      var url = this._generateUrl(endpoint, apiEndpoint);
      var win = this.$window.open(url, '_blank');
      win.focus();

      return this.$q(function (resolve, reject) {
        that.$window.addEventListener('message', onMessage);

        var cancelledListener = that.eventService.$on(that.eventService.events.VCS_OAUTH_CANCELLED, function () {
          removeListeners();
          reject('VCS_OAUTH_CANCELLED');
        });

        function onMessage(event) {
          var message = angular.fromJson(event.data);
          if (message.name === 'VCS OAuth - success') {
            resolve();
            win.close();
            removeListeners();
          } else if (message.name === 'VCS OAuth - failure') {
            reject();
            removeListeners();
          }
        }

        function removeListeners() {
          that.$window.removeEventListener('message', onMessage);
          cancelledListener();
        }
      });
    },

    _generateUrl: function (endpoint, apiEndpoint) {
      return '/pp/v1/vcs/oauth/auth?endpoint=' + (endpoint || this.GITHUB_ENDPOINTS.URL) +
        '&api_endpoint=' + (apiEndpoint || this.GITHUB_ENDPOINTS.API_URL);
    },

    cancel: function () {
      this.eventService.$emit(this.eventService.events.VCS_OAUTH_CANCELLED);
    }
  });

})();
