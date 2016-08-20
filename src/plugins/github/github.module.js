(function () {
  'use strict';

  angular
    .module('github', [
      'github.api',
      'github.event',
      'github.model',
      'github.view'
    ])
    .constant('GITHUB_ENDPOINTS', {
      URL: 'https://github.com',
      API_URL: 'https://api.github.com'
    });

})();
