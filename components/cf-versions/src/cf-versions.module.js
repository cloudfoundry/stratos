(function () {
  'use strict';

  angular
    .module('cf-versions', [
      'cloud-foundry',
      'cf-versions.api',
      'cf-versions.model',
      'cf-versions.view'
    ]);

})();
