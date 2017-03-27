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
    ]);
})();
