(function () {
  'use strict';

  angular
    .module('service-manager.tiles')
    .directive('serviceManagerTile', ServiceManagerTile);

  ServiceManagerTile.$inject = [];

  function ServiceManagerTile() {
    return {
      bindToController: {
        service: '=',
        connect: '=',
        disconnect: '=',
        unregister: '='
      },
      controller: ServiceManagerTileController,
      controllerAs: 'tileCtrl',
      scope: {},
      templateUrl: 'plugins/service-manager/view/tiles/manager/service-manager-tile.html'
    };
  }

  ServiceManagerTileController.$inject = [
    '$scope',
    '$state',
    'app.model.modelManager',
    'app.api.apiManager',
    'app.utils.utilsService',
    'cloud-foundry.model.modelUtils'
  ];

  /**
   * @name ServiceManagerTileController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $state - the angular $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.api.apiManager} apiManager - the API management service
   * @param {app.utils.utilsService} utils - the utils service
   * @param {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   * @property {number} orgCount - organisation count
   * @property {number} userCount - user count
   * @property {object} cardData - gallery-card directive data object
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   */
  function ServiceManagerTileController($scope, $state, modelManager, apiManager, utils, modelUtils) {
    var that = this;

    this.$state = $state;
    // Need to fetch the total number of organizations and users. To avoid fetching all items, only fetch 1 and read
    // list metadata total_results. In order to do this we must go via the api, not the model.
    this.userApi = apiManager.retrieve('cloud-foundry.api.Users');
    this.organizationApi = apiManager.retrieve('cloud-foundry.api.Organizations');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.modelUtils = modelUtils;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.serviceManagerModel = modelManager.retrieve('service-manager.model');
    this.instancesCount = null;
    this.servicesCount = null;
    this.userService = {};

    var cardData = {};
    var expiredStatus = {
      classes: 'danger',
      icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
      description: gettext('Token has expired')
    };

    var erroredStatus = {
      classes: 'danger',
      icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
      description: gettext('Cannot contact endpoint')
    };

    cardData.title = this.service.name;
    this.getCardData = function () {
      if (this.userService.error) {
        cardData.status = erroredStatus;
      } else if (that.service.hasExpired) {
        cardData.status = expiredStatus;
      } else {
        delete cardData.status;
      }
      return cardData;
    };

    function init() {
      $scope.$watch(function () { return that.service; }, function (newVal) {
        if (!newVal) {
          return;
        }
        that.userService = that.userServiceInstanceModel.serviceInstances[that.service.guid] || {};
        that.serviceManagerModel.getModel(that.service.guid).then(function (model) {
          that.instancesCount = model.instances.length;
          that.servicesCount = model.services.length;
          console.log('HELLO');
          console.log(model);
        });
      });
    }

    // Ensure the parent state is fully initialised before we start our own init
    //utils.chainStateResolve('endpoint.clusters.tiles', $state, init);
    init();
  }

  angular.extend(ServiceManagerTileController.prototype, {

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name setUserCount
     * @description Determine the number of users associated with this cluster
     */
    setUserCount: function () {
      this.userCount = 0;

      if (!this.service.isConnected || this.userService.error ||
        !this.stackatoInfo.info.endpoints.hcf[this.service.guid].user.admin) {
        this.userCount = undefined;
        return;
      }

      var that = this;
      this.userApi.ListAllUsers({'results-per-page': 1}, this.modelUtils.makeHttpConfig(this.service.guid))
        .then(function (response) {
          that.userCount = response.data.total_results;
        })
        .catch(function () {
          that.userCount = undefined;
        });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name setOrganisationCount
     * @description Determine the number of organisations associated with this cluster
     */
    setOrganisationCount: function () {
      this.orgCount = 0;

      if (!this.service.isConnected || this.userService.error) {
        this.orgCount = undefined;
        return;
      }
      var that = this;
      this.organizationApi.ListAllOrganizations({'results-per-page': 1},
        this.modelUtils.makeHttpConfig(this.service.guid))
        .then(function (response) {
          that.orgCount = response.data.total_results;
        })
        .catch(function () {
          that.orgCount = undefined;
        });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name summary
     * @description Navigate to the cluster summary page for this cluster
     */
    summary: function () {
      this.$state.go('sm.endpoint.detail.instances', {guid: this.service.guid});
    }

  });

})();
