(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('serviceRegistration', serviceRegistration);

  serviceRegistration.$inject = ['app.basePath'];

  /**
   * @namespace app.view.serviceRegistration
   * @memberof app.view
   * @name serviceRegistration
   * @description A service-registration directive
   * @param {string} path - the application base path
   * @returns {object} The service-registration directive definition object
   */
  function serviceRegistration(path) {
    return {
      bindToController: {
        showOverlayRegistration: '=?'
      },
      controller: ServiceRegistrationController,
      controllerAs: 'serviceRegistrationCtrl',
      scope: {},
      templateUrl: path + 'view/service-registration/service-registration.html'
    };
  }

  ServiceRegistrationController.$inject = [
    '$scope',
    'app.model.modelManager',
    'app.api.apiManager',
    'helion.framework.widgets.detailView'
  ];

  /**
   * @namespace app.view.ServiceRegistrationController
   * @memberof app.view
   * @name ServiceRegistrationController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {helion.framework.widgets.detailView} detailView - detail view service
   * @property {boolean} overlay - flag to show or hide this component
   * @property {app.model.serviceInstance} serviceInstanceModel - the service instance model
   * @property {app.model.user} userModel - the user model
   * @property {array} serviceInstances - the service instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   */
  function ServiceRegistrationController($scope, modelManager, apiManager, detailView) {
    var that = this;
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.clusterAddFlyoutActive = false;
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.userModel = modelManager.retrieve('app.model.user');
    this.serviceInstances = {};
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.credentialsFormOpen = false;
    this.warningMsg = gettext('Authentication failed, please try reconnect.');
    this.detailView = detailView;
    this.currentEndpoints = [];
    // TODO woodnt: There must be a more reproducable/general way of doing this.
    this.cfModel = modelManager.retrieve('cloud-foundry.model.application');

    $scope.$watchCollection(function () {
      return that.cnsiModel.serviceInstances;
    }, function (newCnsis) {
      _.forEach(newCnsis, function (cnsi) {
        var guid = cnsi.guid;
        if (angular.isUndefined(that.serviceInstances[guid])) {
          that.serviceInstances[guid] = cnsi;
        } else {
          angular.extend(that.serviceInstances[guid], cnsi);
        }
      });
    });

    $scope.$watchCollection(function() {
      return that.serviceInstances;
    }, function(newCnsis) {
      that.currentEndpoints = _.map(newCnsis,
        function(c) {
          var endpoint = c.api_endpoint;
          return endpoint.Scheme + '://' + endpoint.Host;
        });
    });

    this.userCnsiModel.list().then(function() {
      angular.extend(that.serviceInstances, that.userCnsiModel.serviceInstances);
      that.cnsiModel.list();
    });
  }

  angular.extend(ServiceRegistrationController.prototype, {
    /**
     * @function completeRegistration
     * @memberOf app.view.ServiceRegistrationController
     * @description Set service instances as registered
     */
    completeRegistration: function () {
      var that = this;
      if (this.userCnsiModel.numValid > 0) {
        this.userModel.updateRegistered(true)
          .then(function () {
            that.showOverlayRegistration = false;
          });
      }
    },

    /**
     * @function connect
     * @memberOf app.view.ServiceRegistrationController
     * @description Connect service instance for user
     * @param {object} serviceInstance - the service instance to connect
     */
    connect: function (serviceInstance) {
      this.activeServiceInstance = serviceInstance;
      this.credentialsFormOpen = true;
    },

    /**
     * @function disconnect
     * @memberOf app.view.ServiceRegistrationController
     * @description Disconnect service instance for user
     * @param {object} serviceInstance - the service instance to disconnect
     */
    disconnect: function (serviceInstance) {
      var that = this;

      // Our mocking system uses "id" but the real systems use "guid".
      // This bandaid will allow the use of either.
      var id = angular.isUndefined(serviceInstance.guid) ? serviceInstance.id : serviceInstance.guid;

      this.userCnsiModel.disconnect(id)
        .then(function success() {
          delete serviceInstance.account;
          delete serviceInstance.expires_at;
          delete serviceInstance.valid;
          that.userCnsiModel.numValid -= 1;
          that.cfModel.all();
        });
    },

    onConnectCancel: function () {
      this.credentialsFormOpen = false;
    },

    onConnectSuccess: function () {
      this.userCnsiModel.numValid += 1;
      this.credentialsFormOpen = false;
      this.activeServiceInstance = null;
    },

    remove: function (serviceInstance) {
      var that = this;
      this.cnsiModel.remove(serviceInstance)
        .then(function success() {
          that.serviceInstances = {};
          that.userCnsiModel.list().then(function () {
            angular.extend(that.serviceInstances, that.userCnsiModel.serviceInstances);
            that.cnsiModel.list();
          });
        });
    },

    /**
     * @function showClusterAddForm
     * @memberOf app.view.ServiceRegistrationController
     * @description Show the cluster add form flyout
     */
    showClusterAddForm: function () {
      this.clusterAddFlyoutActive = true;
    },

    /**
     * @function hideClusterAddForm
     * @memberOf app.view.ServiceRegistrationController
     * @description Hide the cluster add form flyout
     */
    hideClusterAddForm: function () {
      this.clusterAddFlyoutActive = false;
    },

    /**
     * @function showHCEEndpointAddForm
     * @memberOf app.view.ServiceRegistrationController
     * @description Show the HCE Endpoint add form detail view
     */
    showHCEEndpointAddForm: function () {
      // This code is shamelessly copied from app/view/cluster-registration/cluster-registration.directive.js
      // I take that back, it was EXTREMELY SHAMEFUL.
      // -- woodnt

      var that = this;
      var data = { name: '', url: '' };
      this.detailView(
        {
          templateUrl: 'app/view/hce-registration/hce-registration.html',
          title: gettext('Register Code Engine Endpoint')
        },
        {
          data: data,
          options: {
            instances: this.currentEndpoints
          }
        }
      ).result.then(function () {
        return that.serviceInstanceApi.createHCE(data.url, data.name).then(function () {
          that.cnsiModel.list();
        });
      });
    }
  });

})();
