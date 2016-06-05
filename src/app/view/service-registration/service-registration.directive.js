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
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.ServiceRegistrationController
   * @memberof app.view
   * @name ServiceRegistrationController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {boolean} overlay - flag to show or hide this component
   * @property {app.model.serviceInstance} serviceInstanceModel - the service instance model
   * @property {app.model.user} userModel - the user model
   * @property {array} serviceInstances - the service instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   */
  function ServiceRegistrationController($scope, modelManager) {
    var that = this;
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.clusterAddFlyoutActive = false;
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.userModel = modelManager.retrieve('app.model.user');
    this.serviceInstances = {};
    this.credentialsFormOpen = false;
    this.warningMsg = gettext('Authentication failed, please try reconnect.');

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

    this.cnsiModel.list();
    this.userCnsiModel.list().then(function () {
      angular.extend(that.serviceInstances, that.userCnsiModel.serviceInstances);
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

      // TODO: Our mocking system uses "id" but the real systems use "guid".
      //       This bandaid will allow the use of either.
      var id = angular.isUndefined(serviceInstance.guid) ? serviceInstance.id : serviceInstance.guid;

      this.userCnsiModel.disconnect(id)
        .then(function success() {
          delete serviceInstance.account;
          delete serviceInstance.expires_at;
          delete serviceInstance.valid;
          that.userCnsiModel.numValid -= 1;
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
    }
  });

})();
