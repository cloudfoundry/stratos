(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('organizationTile', OrganizationTile);

  OrganizationTile.$inject = [];

  function OrganizationTile() {
    return {
      bindToController: true,
      controller: OrganizationTileController,
      controllerAs: 'organizationTileCtrl',
      scope: {
        organization: '='
      },
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/organization-tile/organization-tile.html'
    };
  }

  OrganizationTileController.$inject = [
    'app.model.modelManager',
    '$state',
    'app.utils.utilsService'
  ];

  /**
   * @name OrganizationTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @param {object} utils - our utils service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationTileController(modelManager, $state, utils) {
    var that = this;
    this.$state = $state;
    this.actions = [];
    this.setActions();

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');

    // Present memory usage
    var usedMemHuman = utils.mbToHumanSize(this.organization.memUsed);
    var memQuotaHuman = utils.mbToHumanSize(this.organization.memQuota);
    this.memory = usedMemHuman + ' / ' + memQuotaHuman;

    // Present instances utilisation
    var instancesUsed = this.organization.instances;
    var appInstanceQuota = this.organization.instancesQuota;
    if (appInstanceQuota === -1) {
      appInstanceQuota = '∞';
    }
    this.instances = instancesUsed + ' / ' + appInstanceQuota;

    // Present the user's roles
    this.roles = that.organizationModel.organizationRolesToString(this.organization.roles);
  }

  angular.extend(OrganizationTileController.prototype, {

    setActions: function () {
      this.actions.push({
        name: 'Edit Organization',
        disabled: true,
        execute: function () {
        }
      });
      this.actions.push({
        name: 'Delete Organization',
        disabled: true,
        execute: function () {
        }
      });
      this.actions.push({
        name: 'Assign User(s)',
        disabled: true,
        execute: function () {
        }
      });
    },

    summary: function () {
      this.$state.go('endpoint.clusters.cluster.organization.detail.spaces', {organization: this.organization.guid});
    }

  });

})();
