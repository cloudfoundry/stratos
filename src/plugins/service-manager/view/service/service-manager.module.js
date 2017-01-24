(function () {
  'use strict';

  angular
    .module('service-manager.view.service', [
      'service-manager.view.service.detail',
      'service-manager.view.service.detail.instances',
      'service-manager.view.service.detail.services',
      'ncy-angular-breadcrumb'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.endpoint', {
      url: '/:guid',
      abstract: true,
      template: '<ui-view/>',
      controller: ServiceManagerController,
      controllerAs: 'smCtrl'
    });
  }

  ServiceManagerController.$inject = [
    '$stateParams',
    '$log',
    'app.utils.utilsService',
    '$state',
    '$q',
    'app.view.endpoints.clusters.cluster.rolesService',
    'app.model.modelManager',
    'service-manager.view.create-instance.dialog'
  ];

  function ServiceManagerController($stateParams, $log, utils, $state, $q, rolesService, modelManager, createInstanceDialog) {
    var that = this;

    this.initialized = false;
    this.guid = $stateParams.guid;
    this.$state = $state;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.createInstanceDialog = createInstanceDialog;

    this.hsmModel = modelManager.retrieve('service-manager.model');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.getEndpoint = function () {
      return utils.getClusterEndpoint(that.endpoint);
    };

    this.stackatoInfo.getStackatoInfo().then(function (info) {
      that.endpoint = info.endpoints.hsm[that.guid];

      that.hsmModel.getModel(that.guid).then(function (model) {
        that.model = model;
      });
    });
  }

  angular.extend(ServiceManagerController.prototype, {

    createInstance: function (service) {
      var that = this;
      var p = this.createInstanceDialog.show(this.guid, service);
      p.result.then(function (instance) {
        console.log('instance created');
        console.log(instance.instance_id);

        // Open the instance
        that.$state.go('sm.endpoint.instance.components', {guid: that.guid, id: instance.instance_id});
      });
    }
  });

})();
