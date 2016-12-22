(function () {
  'use strict';

  angular
    .module('helion.framework', [
      'helion.framework.filters',
      'helion.framework.utils',
      'helion.framework.validators',
      'helion.framework.widgets',
      'angular-websocket',
      'ngAnimate',
      'toastr'
    ])
    // UI Framework is not integrated, so the path can be set to be empty
    .constant('helion.framework.basePath', '');

})();
