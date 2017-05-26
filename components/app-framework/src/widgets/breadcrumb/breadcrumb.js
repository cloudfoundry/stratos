(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .config(config);

  function config($breadcrumbProvider) {
    $breadcrumbProvider.setOptions({
      templateUrl: 'framework/widgets/breadcrumb/breadcrumb-template.html'
    });
  }
})();
