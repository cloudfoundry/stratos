(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('clusterRegistration', clusterRegistration);

  clusterRegistration.$inject = ['app.basePath'];

  /**
   * @namespace app.view.clusterRegistration
   * @memberof app.view
   * @name clusterRegistration
   * @description A cluster-registration directive
   * @param {string} path - the application base path
   * @returns {object} The cluster-registration directive definition object
   */
  function clusterRegistration(path) {
    return {
      bindToController: {
        showClusterOverlayRegistration: '=?'
      },
      controller: ClusterRegistrationController,
      controllerAs: 'clusterRegistrationCtrl',
      templateUrl: path + 'view/cluster-registration/cluster-registration.html'
    };
  }

  ClusterRegistrationController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.ClusterRegistrationController
   * @memberof app.view
   * @name ClusterRegistrationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {boolean} overlay - flag to show or hide this component
   * @property {app.model.serviceInstance} serviceInstanceModel - the cluster instance model
   * @property {array} clusterInstances - the cluster instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   */
  function ClusterRegistrationController(modelManager) {
    this.overlay = angular.isDefined(this.showClusterOverlayRegistration);
    this.clusterInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.clusterInstances = this.clusterInstanceModel.serviceInstances;
    this.clusterInstanceModel.list();
  }

})();
