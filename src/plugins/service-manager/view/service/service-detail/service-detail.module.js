(function () {
  'use strict';

  angular
    .module('service-manager.view.service.service-detail', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {

    $stateProvider.state('sm.endpoint.service', {
      url: '/service/:id',
      template: '<ui-view/>',
      controller: ServiceManagerServiceController,
      controllerAs: 'svCtrl',
      abstract: true,
      data: {
        activeMenuState: 'sm.list'
      }
    });

    $stateProvider.state('sm.endpoint.service.detail', {
      url: '/detail',
      templateUrl: 'plugins/service-manager/view/service/service-detail/service-detail.html',
      controller: ServiceManagerServiceDetailController,
      controllerAs: 'sCtrl',
      ncyBreadcrumb: {
        label: '{{ svCtrl.id || "..." }}',
        parent: 'sm.endpoint.detail.services'
      },
      data: {
        activeMenuState: 'sm.list'
      }
    });
  }

  ServiceManagerServiceController.$inject = [
    '$state'
  ];

  function ServiceManagerServiceController($state) {
    this.id = $state.params.id;
  }

  ServiceManagerServiceDetailController.$inject = [
    '$stateParams',
    '$state',
    '$q',
    'app.utils.utilsService',
    'app.model.modelManager'
  ];

  function ServiceManagerServiceDetailController($stateParams, $state, $q, utils, modelManager) {
    var that = this;

    this.initialized = false;
    this.guid = $stateParams.guid;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

    this.hsmModel = modelManager.retrieve('service-manager.model');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.getEndpoint = function () {
      return utils.getClusterEndpoint(that.endpoint);
    };

    var guid = $state.params.guid;
    this.id = $state.params.id;

    function init() {
      that.hsmModel = modelManager.retrieve('service-manager.model');

      var services = that.hsmModel.model[guid].services;
      that.service = _.find(services, {id: that.id});

      if (!that.service) {
        return $q.reject('Service with id \'' + that.id + '\' not found: ');
      }

      that.versions = [];
      _.each(that.service.product_versions, function (product) {
        _.each(product.sdl_versions, function (sdl, sdlVersion) {
          that.versions.push({
            product_version: product.product_version,
            sdl_version: sdlVersion,
            latest: sdlVersion === product.latest
          });
        });
      });
    }

    utils.chainStateResolve('sm.endpoint.service.detail', $state, init);
  }

})();
