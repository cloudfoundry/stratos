(function() {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('clusterTile', ClusterTile);

  ClusterTile.$inject = [];

  function ClusterTile() {
    return {
      bindToController: {
        service: '=',
        connect: '=',
        disconnect: '=',
        unregister: '='
      },
      controller: ClusterTileController,
      controllerAs: 'clusterTile',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/list/cluster-tile/cluster-tile.html'
    };
  }

  ClusterTileController.$inject = [
    '$state',
    'app.model.modelManager'
  ];

  /**
   * @name ClusterTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   * @property {string} accountStatus - connected user's account status
   * @property {number} orgCount - organisation count
   * @property {number} userCount - user count
   * @property {object} cardData - gallery-card directive data object
   */
  function ClusterTileController($state, modelManager) {
    this.$state = $state;
    this.cfModelUsers = modelManager.retrieve('cloud-foundry.model.users');
    this.cfModelOrg = modelManager.retrieve('cloud-foundry.model.organization');
    this.currentUserAccount = modelManager.retrieve('app.model.account');

    this.actions = [];
    this.accountStatus = null;
    this.orgCount = null;
    this.userCount = null;
    this.cardData = {
      title: this.service.name
    };
    if (this.service.hasExpired) {
      this.cardData.status = {
        classes: 'danger',
        icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
        description: gettext('Token has expired')
      }
    }

    this.setActions();
    this.setAccountStatus();
    this.setOrganisationCount();
    this.setUserCount();

  }

  angular.extend(ClusterTileController.prototype, {

    setActions: function() {
      var that = this;
      this.actions = [];

      if (this.service.isConnected) {
        this.actions.push({
          name: gettext('Disconnect'),
          execute: function() {
            that.disconnect(that.service.guid);
          }
        });
      } else {
        this.actions.push({
          name: gettext('Connect'),
          execute: function() {
            that.connect(that.service);
          }
        });
      }

      if (this.currentUserAccount.isAdmin()) {
        this.actions.push({
          name: gettext('Unregister'),
          execute: function() {
            that.unregister(that.service);
          }
        });
      }
    },

    setAccountStatus: function() {
      //TODO (RC): See TEAMFOUR-723. Need to fetch account info from scope. Dependent on TEAMFOUR-205 + TEAMFOUR-617.
      this.accountStatus = null;
    },

    setUserCount: function() {
      if (!this.service.isConnected) {
        return;
      }

      var that = this;
      // We should look to improve this, maybe overload portal-proxy such that the whole user set has to be retrieved
      // just for the count. This will help in the case the connected user does not have privileges.
      this.cfModelUsers.listAllUsers(this.service.guid).then(function(res) {
        that.userCount = _.get(res, 'length');
      });
    },

    setOrganisationCount: function() {
      if (!this.service.isConnected) {
        return;
      }

      var that = this;
      // We should look to improve this, maybe overload portal-proxy such that the whole user set has to be retrieved
      // just for the count. This will help in the case the connected user does not have privileges.
      this.cfModelOrg.listAllOrganizations(this.service.guid).then(function(res) {
        that.orgCount = _.get(res, 'length');
      });
    },

    summary: function() {
      this.$state.go('endpoints.cluster', {guid: this.service.guid});
    }

  });

})();
