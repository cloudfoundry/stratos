(function () {
  'use strict';

  angular
    .module('service-manager.view.service.detail', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.endpoint.detail', {
      url: '/detail',
      abstract: true,
      templateUrl: 'plugins/service-manager/view/service/detail/detail.html',
      // ncyBreadcrumb: {
      //   label: '{{ smCtrl.endpoint.name || "..." }}',
      //   parent: 'sm.tiles'
      // },
      controller: ServiceManagerDetailController,
      controllerAs: 'svcSDetailCtrl'
    });
  }

  ServiceManagerDetailController.$inject = [
    '$state',
    '$rootScope',
    '$scope',
    'app.model.modelManager'
  ];

  function ServiceManagerDetailController($state, $rootScope, $scope, modelManager) {
    var that = this;
    this.hsmModel = modelManager.retrieve('service-manager.model');
    if ($state.current.name === 'sm.endpoint.detail') {
      var activeTab = hsmModel.detailActiveTab ? '' : 'sm.endpoint.detail.instances';
      $state.go(activeTab);
    }

    this.removeStateChangeListener = $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
      if (toState.name.indexOf('sm.endpoint.detail') === 0 && fromState.name.indexOf('sm.endpoint.detail') === 0) {
        that.hsmModel.detailActiveTab = toState.name;
      }
    });

    $scope.$on('$destroy', function () {
      that.removeStateChangeListener();
    });

  }
})();
