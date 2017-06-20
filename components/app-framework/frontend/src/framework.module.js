(function () {
  'use strict';

  angular
    .module('app.framework', [
      'ncy-angular-breadcrumb',
      'app.framework.filters',
      'app.framework.utils',
      'app.framework.validators',
      'app.framework.widgets',
      'angular-websocket',
      'ngAnimate',
      'toastr'
    ]);
})();
