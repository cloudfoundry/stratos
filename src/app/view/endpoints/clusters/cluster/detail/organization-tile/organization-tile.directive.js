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
  function OrganizationTileController($state, utils) {
    this.$state = $state;
    this.actions = [];
    this.setActions();

    // The list of all organization roles is: org_user, org_manager, org_auditor, billing_manager
    var ROLE_TO_STRING = {
      org_user: gettext('User'),
      org_manager: gettext('Manager'),
      org_auditor: gettext('Auditor'),
      billing_manager: gettext('Billing Manager')
    };

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
    var roles = this.organization.roles;
    if (roles.length === 0) {
      // Shouldn't happen as we should at least be a user of the org
      this.roles = gettext('none');
    } else {
      // If there are more than one role, don't show the user role
      if (roles.length > 1) {
        _.remove(roles, function (role) {
          return role === 'org_user';
        });
      }
      this.roles = _.map(roles, function (role) {
        return ROLE_TO_STRING[role];
      }).join(', ');
    }
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
      this.$state.go('endpoint.clusters.cluster.organization.detail.spaces', {organization: this.organization.metadata.guid});
    }

  });

})();
