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
    '$state',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.ServiceRegistrationController
   * @memberof app.view
   * @name ServiceRegistrationController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {object} $state - the Angular $state service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {boolean} overlay - flag to show or hide this component
   * @property {app.model.serviceInstance} serviceInstanceModel - the service instance model
   * @property {Array} serviceInstances - the service instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   * @property {app.model.stackatoInfo} stackatoInfoModel - the stackato info model containing connected service/user data
   */
  function ServiceRegistrationController($scope, $state, modelManager) {
    var that = this;
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.serviceInstances = {};
    this.credentialsFormOpen = false;
    this.warningMsg = gettext('Authentication failed, please try to reconnect.');
    this.currentEndpoints = [];
    this.stackatoInfoModel = modelManager.retrieve('app.model.stackatoInfo');
    this.$state = $state;

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

    $scope.$watchCollection(function () {
      return that.serviceInstances;
    }, function (newCnsis) {
      that.currentEndpoints = _.map(newCnsis,
        function (c) {
          var endpoint = c.api_endpoint;
          return endpoint.Scheme + '://' + endpoint.Host;
        });
    });

    this.userCnsiModel.list().then(function () {
      angular.extend(that.serviceInstances, that.userCnsiModel.serviceInstances);
      that.cnsiModel.list();
    });
  }

  angular.extend(ServiceRegistrationController.prototype, {
    /**
     * @function completeRegistration
     * @memberof app.view.ServiceRegistrationController
     * @description Set service instances as registered
     */
    completeRegistration: function () {
      this.showOverlayRegistration = false;
      // Navigate to intended state, this helps refresh any init state now that the connected services have changed
      // (particularly important for apps on app wall, endpoint tiles that are now connected, etc)
      this.$state.go(this.$state.current.name, {}, {reload: true});
    },

    /**
     * @function connect
     * @memberof app.view.ServiceRegistrationController
     * @description Connect service instance for user
     * @param {object} serviceInstance - the service instance to connect
     */
    connect: function (serviceInstance) {
      this.activeServiceInstance = serviceInstance;
      this.credentialsFormOpen = true;
    },

    /**
     * @function disconnect
     * @memberof app.view.ServiceRegistrationController
     * @description Disconnect service instance for user
     * @param {object} userServiceInstance - the model user version of the service instance to disconnect
     */
    disconnect: function (userServiceInstance) {
      var that = this;
      this.userCnsiModel.disconnect(userServiceInstance.guid)
        .then(function success() {
          delete userServiceInstance.account;
          delete userServiceInstance.token_expiry;
          delete userServiceInstance.valid;
          that.userCnsiModel.numValid -= 1;
          // Update stackato info to remove connected user's name
          that.stackatoInfoModel.getStackatoInfo().then(function () {
            that.authModel.remove(userServiceInstance.guid);
          });
        });
    },

    onConnectCancel: function () {
      this.credentialsFormOpen = false;
    },

    onConnectSuccess: function (serviceInstance) {
      var that = this;
      // Update stackato info to get connected user's name
      this.stackatoInfoModel.getStackatoInfo().then(function () {
        that.authModel.initializeForEndpoint(serviceInstance.guid, true).then(function () {
          that.userCnsiModel.numValid += 1;
          that.credentialsFormOpen = false;
          that.activeServiceInstance = null;
        });
      });
    }

  });

})();
