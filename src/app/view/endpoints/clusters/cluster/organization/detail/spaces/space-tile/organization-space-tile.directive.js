(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space')
    .directive('organizationSpaceTile', OrganizationSpaceTile);

  OrganizationSpaceTile.$inject = [];

  function OrganizationSpaceTile() {
    return {
      bindToController: {
        space: '='
      },
      controller: OrganizationSpaceTileController,
      controllerAs: 'orgSpaceTileCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/spaces/space-tile/organization-space-tile.html'
    };
  }

  OrganizationSpaceTileController.$inject = [
    '$state',
    '$stateParams',
    'app.model.modelManager',
    '$scope'
  ];

  /**
   * @name OrganizationSpaceTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationSpaceTileController($state, $stateParams, modelManager, $scope) {
    var that = this;

    this.$state = $state;
    this.clusterGuid = $stateParams.guid;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = 'spaces.' + this.clusterGuid + '.' + this.space.metadata.guid;
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.orgPath = 'organizations.' + that.clusterGuid + '.' + that.space.entity.organization_guid;

    this.cardData = {
      title: this.space.entity.name
    };
    this.actions = [
      {
        name: gettext('Edit Space'),
        disabled: true,
        execute: function () {
          alert('Edit Space');
        }
      }, {
        name: gettext('Delete Space'),
        disabled: true,
        execute: function () {
          alert('Delete Space');
        }
      },
      {
        name: gettext('Assign User(sa)'),
        disabled: true,
        execute: function () {
          alert('Assign User(s)');
        }
      }
    ];

    $scope.$watch(function () {
      return that.spaceDetail();
    }, function (spaceDetail) {
      if (!spaceDetail) {
        return;
      }

      // Present memory usage
      // var usedMemHuman = that.utils.mbToHumanSize(orgDetail.memUsed);
      // var memQuotaHuman = that.utils.mbToHumanSize(orgDetail.memQuota);
      // that.memory = usedMemHuman + ' / ' + memQuotaHuman;

      // Present the user's roles
      that.roles = that.spaceModel.spaceRolesToString(spaceDetail.roles);
    });
  }

  angular.extend(OrganizationSpaceTileController.prototype, {

    summary: function () {
      this.$state.go('endpoint.clusters.cluster.organization.space.detail.services', {space: this.space.metadata.guid});
    },

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    },

    orgDetails: function () {
      return _.get(this.organizationModel, this.orgPath);
    }

  });

})();
