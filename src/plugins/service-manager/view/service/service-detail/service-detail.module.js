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

    // Abstract detail route
    $stateProvider.state('sm.endpoint.service.detail', {
      url: '/detail',
      templateUrl: 'plugins/service-manager/view/service/service-detail/service-detail.html',
      controller: ServiceManagerServiceDetailController,
      controllerAs: 'sCtrl',
      ncyBreadcrumb: {
        label: '{{ svCtrl.id || "..." }}',
        parent: 'sm.endpoint.detail.instances'
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
    '$log',
    'app.utils.utilsService',
    '$state',
    '$q',
    'app.view.endpoints.clusters.cluster.rolesService',
    'app.model.modelManager'
  ];

  function ServiceManagerServiceDetailController($stateParams, $log, utils, $state, $q, rolesService, modelManager) {
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
    var id = $state.params.id;

    this.id = id;

    this.hsmModel.getService(guid, id).then(function (data) {
      that.service = data;
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

      /*

      var product = data.product_versions[0];
      var pv = product.product_version;
      var sv = product.latest;

      that.hsmModel.getServiceSdl(guid, id, pv, sv).then(function (sdl) {
        console.log('GOT SDL');
        console.log(sdl);
      });

      that.hsmModel.getServiceProduct(guid, id, pv).then(function (sdl) {
        console.log('GOT PRODUCT');
        console.log(sdl);
      });
      */
    });
  }

})();
