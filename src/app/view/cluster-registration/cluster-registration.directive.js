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
    'app.api.apiManager',
    'helion.framework.widgets.detailView'
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
  function ClusterRegistrationController(modelManager, apiManager, detailView) {
    this.overlay = angular.isDefined(this.showClusterOverlayRegistration);
    this.clusterAddFlyoutActive = false;
    this.clusterInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.clusterInstances = this.clusterInstanceModel.serviceInstances;
    this.clusterInstanceModel.list();
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.detailView = detailView;
  }

  angular.extend(ClusterRegistrationController.prototype, {
    /**
     * @function showClusterAddForm
     * @memberOf app.view.ClusterRegistrationController
     * @description Show the cluster add form flyout
     */
    showClusterAddForm: function () {
      this.clusterAddFlyoutActive = true;
    },

    /**
     * @function hideClusterAddForm
     * @memberOf app.view.ClusterRegistrationController
     * @description Hide the cluster add form flyout
     */
    hideClusterAddForm: function () {
      this.clusterAddFlyoutActive = false;
    },

    /**
     * @function showHCEEndpointAddForm
     * @memberOf app.view.ClusterRegistrationController
     * @description Show the HCE Endpoint add form detail view
     */
    showHCEEndpointAddForm: function () {
      var that = this;
      var data = { name: '', url: '' };
      this.detailView(
        {
          templateUrl: 'app/view/hce-registration/hce-registration.html',
          title: gettext('Register Code Engine Endpoint'),
          class: 'detail-view-thin'
        },
        {
          data: data
        }
      ).result.then(function () {
        return that.serviceInstanceApi.createHCE(data.url, data.name).then(function () {
          that.clusterInstanceModel.list();
        });
      });
    }
  });

})();
