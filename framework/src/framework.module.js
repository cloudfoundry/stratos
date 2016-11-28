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
    /* eslint-disable */
    // We can't use  $window in this context
    .constant('helion.framework.basePath',
      window.env && window.env.HELION_UI_FRAMEWORK_BASE_PATH || '');
    /* eslint-enable */

})();
