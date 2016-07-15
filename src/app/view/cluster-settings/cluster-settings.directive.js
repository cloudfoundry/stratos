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
   * @property {array} serviceInstances - the service instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   */
  function ClusterSettingsController($scope, modelManager, apiManager) {
    var that = this;
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.clusterAddFlyoutActive = false;
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.serviceInstances = {};
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.credentialsFormOpen = false;
    //this.warningMsg = gettext('Authentication failed, please try reconnect.');

    /* eslint-disable */
    // TODO(woodnt): There must be a more reproducable/general way of doing this. https://jira.hpcloud.net/browse/TEAMFOUR-626
    /* eslint-enable */
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

    this.userCnsiModel.list().then(function () {
      angular.extend(that.serviceInstances, that.userCnsiModel.serviceInstances);
      that.cnsiModel.list();
    });
  }

  angular.extend(ClusterSettingsController.prototype, {

    /* eslint-disable */
    // FIXME: When HCE support authentication, update this
    /* eslint-enable */
    /**
     * @function isValid
     * @memberof app.view.ServiceRegistrationController
     * @param {object} cnsi - cnsi object to check for validity
     * @description Determines if the service is connected and can be included in the list
     * @returns {boolean} indicating if the specified cnsi is valid
     */
    isValid: function (cnsi) {
      if (cnsi.cnsi_type === 'hce') {
        return true;
      } else {
        return cnsi.valid;
      }
    },

    /**
     * @function disconnect
     * @memberOf app.view.ServiceRegistrationController
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
          that.cfModel.all();
        }).catch(function () {
        // Failed
        }).finally(function () {
          delete userServiceInstance._busy;
        });
    }
  });

})();
