(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('notification', notification);

  notification.$inject = [
    'app.basePath'
  ];

  function notification(path) {
    return {
      templateUrl: path + '/view/console/top-bar/notification/notification.html'
    };
  }

})();
