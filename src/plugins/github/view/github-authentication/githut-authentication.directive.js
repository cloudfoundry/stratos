(function () {
  'use strict';

  angular
    .module('github.view')
    .directive('githubAuthentication', githubAuthentication);

  githubAuthentication.$inject = [];

  /**
   * @memberof github.view
   * @name githubAuthentication
   * @description a github authentication directive
   * @returns {object} github authentication directive definition object
   */
  function githubAuthentication() {
    return {
      controller: GithubAuthenticationController,
      controllerAs: 'githubAuthenticationCtrl',
      templateUrl: 'plugins/github/view/github-authentication/github-authentication.html'
    };
  }

  GithubAuthenticationController.$inject = [
    '$window'
  ];

  /**
   * @memberof github.view
   * @name GithubAuthenticationController
   * @constructor
   * @param {object} $window - angular $window service
   * @property {object} $window - angular $window service
   */
  function GithubAuthenticationController($window) {
    this.$window = $window;
  }

  angular.extend(GithubAuthenticationController.prototype, {
    openAuthWindow: function () {
      var win = this.$window.open('/pp/v1/github/oauth/auth', '_blank');
      win.focus();
    }
  });

})();
