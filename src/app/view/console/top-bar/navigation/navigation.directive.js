(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('navigation', navigation);

  navigation.$inject = [
    'app.basePath'
  ];

  function navigation(path) {
    return {
      controller: Controller,
      controllerAs: 'NavigationCtrl',
      templateUrl: path + '/view/console/top-bar/navigation/navigation.html'
    };
  }

  Controller.$inject = [
    'app.model.modelManager'
  ];

  function Controller(modelManager) {
    this.menu = modelManager.retrieve('app.model.navigation');
  }

})();
