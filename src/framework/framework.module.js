(function () {
  'use strict';

  angular
    .module('helion.framework', [
      'ncy-angular-breadcrumb',
      'helion.framework.filters',
      'helion.framework.utils',
      'helion.framework.validators',
      'helion.framework.widgets',
      'angular-websocket',
      'ngAnimate',
      'toastr'
    ])
    .constant('helion.framework.basePath', 'framework/');

})();
