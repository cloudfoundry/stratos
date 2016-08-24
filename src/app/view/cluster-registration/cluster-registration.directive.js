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
    'app.model.modelManager',
    'app.view.hcfRegistration',
    'app.view.hceRegistration'
  ];

  /**
   * @namespace app.view.ClusterRegistrationController
   * @memberof app.view
   * @name ClusterRegistrationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.api.apiManager} apiManager - the application api manager
   * @param {helion.framework.widgets.detailView} detailView - detail view service
   * @property {boolean} overlay - flag to show or hide this component
   * @property {app.model.serviceInstance} serviceInstanceModel - the cluster instance model
   * @property {array} clusterInstances - the cluster instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   */
  function ClusterRegistrationController(modelManager, hcfRegistration, hceRegistration) {
    this.overlay = angular.isDefined(this.showClusterOverlayRegistration);
    this.clusterInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.clusterInstances = this.clusterInstanceModel.serviceInstances;
    this.clusterInstanceModel.list();
    this.hcfRegistration = hcfRegistration;
    this.hceRegistration = hceRegistration;
    this.detailView = detailView;
  }

  angular.extend(ClusterRegistrationController.prototype, {
    /**
     * @function showClusterAddForm
     * @memberOf app.view.ClusterRegistrationController
     * @description Show the cluster add form flyout
     */
    showClusterAddForm: function () {
      this.hcfRegistration.add();
    },

    /**
     * @function showHCEEndpointAddForm
     * @memberOf app.view.ClusterRegistrationController
     * @description Show the HCE Endpoint add form detail view
     */
    showHCEEndpointAddForm: function () {
      var that = this;
      this.hcfRegistration.add().then(function () {
        that.clusterInstanceModel.list();
      });
    }
  });

})();
