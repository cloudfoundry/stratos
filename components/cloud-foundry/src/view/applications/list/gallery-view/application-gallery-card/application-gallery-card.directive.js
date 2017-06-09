(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list')
    .directive('applicationGalleryCard', applicationGalleryCard);

  function applicationGalleryCard() {
    return {
      bindToController: {
        app: '=',
        cnsiGuid: '='
      },
      controller: ApplicationGalleryCardController,
      controllerAs: 'applicationGalleryCardCtrl',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/applications/list/' +
      'gallery-view/application-gallery-card/application-gallery-card.html'
    };
  }

  function ApplicationGalleryCardController($state, $scope, modelManager) {

    var vm = this;

    vm.cardData = {
      title: vm.app.entity.name
    };

    vm.goToApp = goToApp;

    $scope.$watch(function () {
      return vm.app.entity.state;
    }, function () {
      vm.canShowStats = vm.app.entity.state === 'STARTED';
    });

    function goToApp() {
      var guids = {
        cnsiGuid: vm.cnsiGuid,
        guid: vm.app.metadata.guid
      };
      var appModel = modelManager.retrieve('cloud-foundry.model.application');
      appModel.initApplicationFromSummary(vm.app);
      $state.go('cf.applications.application.summary', guids);
    }
  }

})();
