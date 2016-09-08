(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('clusterSettings', clusterSettings);

  clusterSettings.$inject = ['app.basePath'];

  /**
   * @namespace app.view.clusterSettings
   * @memberof app.view
   * @name clusterSettings
   * @description A custer cluster settings directive
   * @param {string} path - the application base path
   * @returns {object} The cluster-settings directive definition object
   */
  function clusterSettings(path) {
    return {
      bindToController: {
        showOverlayRegistration: '=?'
      },
      controller: ClusterSettingsController,
      controllerAs: 'clusterSettingsCtrl',
      scope: {},
      templateUrl: path + 'view/cluster-settings/cluster-settings.html'
    };
  }

  ClusterSettingsController.$inject = [
    '$scope',
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  /**
   * @namespace app.view.ClusterSettingsController
   * @memberof app.view
   * @name ClusterSettingsController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {boolean} overlay - flag to show or hide this component
   * @property {app.model.serviceInstance} serviceInstanceModel - the service instance model
   * @property {Array} serviceInstances - the service instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   */
  function ClusterSettingsController($scope, modelManager, apiManager) {
    var that = this;
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.serviceInstances = {};
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.credentialsFormOpen = false;
    this.activeServiceInstance = null;
    //this.warningMsg = gettext('Authentication failed, please try reconnect.');

    this.cfModel = modelManager.retrieve('cloud-foundry.model.application');

    $scope.$watchCollection(function () {
      return that.stackatoInfo.info.endpoints;
    }, function (endpoints) {
      // Fetch user service metadata - this will attempt token refresh which lets us show if a service has expired
      that.userServiceInstanceModel.list().then(function (data) {
        _.each(data, function (obj, guid) {
          if (angular.isDefined(that.serviceInstances[guid])) {
            that.serviceInstances[guid].expired = !obj.valid;
          }
        });
      });
      _.forEach(endpoints, function (obj, type) {
        _.forEach(obj, function (ep) {
          var guid = ep.guid;
          ep.type = ep.cnsi_type = type;
          /* eslint-disable */
          // TODO(nwm): The cnsi list should have already been fetched - we meed this as Stackato Info does not return the URL
          /* eslint-enable */
          var svc = _.find(that.cnsiModel.serviceInstances, {guid: guid});
          ep.api_endpoint = svc ? svc.api_endpoint : undefined;
          if (angular.isUndefined(that.serviceInstances[guid])) {
            that.serviceInstances[guid] = ep;
          } else {
            angular.extend(that.serviceInstances[guid], ep);
          }
        });
      });
    });

    // The watch above will trigger when the info has loaded and updated the model
    this.stackatoInfo.getStackatoInfo().then(function () {
      that.authModel.initialize();
    });
  }

  angular.extend(ClusterSettingsController.prototype, {

    /**
     * @function isValid
     * @memberof app.view.ServiceRegistrationController
     * @param {object} cnsi - cnsi object to check for validity
     * @description Determines if the service is connected and can be included in the list
     * @returns {boolean} indicating if the specified cnsi is valid
     */
    isValid: function (cnsi) {
      return cnsi.user !== null;
    },

    /**
     * @function reconnect
     * @memberof app.view.ClusterSettingsController
     * @description Connect to service
     * @param {object} serviceInstance - Service instance
     */
    reconnect: function (serviceInstance) {
      this.activeServiceInstance = serviceInstance;
      this.credentialsFormOpen = true;
    },

    /**
     * @function onConnectCancel
     * @memberof app.view.ClusterSettingsController
     * @description Handle the cancel from connecting to a cluster
     */
    onConnectCancel: function () {
      this.credentialsFormOpen = false;
    },

    /**
     * @function onConnectCancel
     * @memberof app.view.ClusterSettingsController
     * @description Handle the success from connecting to a cluster
     */
    onConnectSuccess: function () {
      this.credentialsFormOpen = false;
      this.activeServiceInstance = undefined;
      this.stackatoInfo.getStackatoInfo();
    },

    /**
     * @function disconnect
     * @memberOf app.view.ClusterSettingsController
     * @description Disconnect service instance for user
     * @param {object} userServiceInstance - the model user version of the service instance to disconnect
     */
    disconnect: function (userServiceInstance) {
      var that = this;
      userServiceInstance._busy = true;

      // Our mocking system uses "id" but the real systems use "guid".
      // This bandaid will allow the use of either.
      var id = angular.isUndefined(userServiceInstance.guid) ? userServiceInstance.id : userServiceInstance.guid;

      this.userCnsiModel.disconnect(id)
        .then(function success() {
          delete userServiceInstance.account;
          delete userServiceInstance.token_expiry;
          delete userServiceInstance.valid;
          that.userCnsiModel.numValid -= 1;
          that.stackatoInfo.getStackatoInfo().then(function () {
            // Remove principal for disconnected instance
            that.authModel.remove(id);
          });
          that.cfModel.all();
        })
        .catch(function () {
          // Failed
        })
        .finally(function () {
          delete userServiceInstance._busy;
        });
    },

    /**
     * @function getCnsiTypeText
     * @memberOf app.view.ServiceRegistrationController
     * @description helper for template to get CNSI Type text
     * @param {object} cnsi CNSI
     * @returns {string} CNSI text
     */
    getCnsiTypeText: function (cnsi) {
      if (cnsi.cnsi_type === 'hcf') {
        return gettext('Cloud Foundry Cluster');
      } else if (cnsi.cnsi_type === 'hce') {
        return gettext('Code Engine');
      } else {
        // Unknown type, just return type name
        return gettext(cnsi.cnsi_type);
      }
    },

    /**
     * @function getClusterUserName
     * @memberOf app.view.ServiceRegistrationController
     * @description helper for template to get cluster user name
     * @param {object} cnsi CNSI information
     * @returns {string} CNSI user name
     */
    getClusterUserName: function (cnsi) {
      return this.stackatoInfo.info.endpoints[cnsi.cnsi_type]
        [cnsi.guid].user.name;
    }
  });

})();
