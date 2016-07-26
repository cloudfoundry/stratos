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
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/spaces/space-tile/organization-space-tile.html'
    };
  }

  OrganizationSpaceTileController.$inject = [
    '$state',
    '$stateParams',
    'app.model.modelManager',
    '$q'
  ];

  /**
   * @name OrganizationSpaceTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $q - the angular $q service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationSpaceTileController($state, $stateParams, modelManager, $q) {
    var that = this;

    this.$state = $state;
    this.clusterGuid = $stateParams.guid;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.space.metadata.guid);
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.orgPath = this.organizationModel.fetchOrganizationPath(this.clusterGuid, that.space.entity.organization_guid);

    this.cardData = {
      title: this.space.entity.name
    };
    this.actions = [
      {
        name: gettext('Edit Space'),
        disabled: true,
        execute: function () {
        }
      }, {
        name: gettext('Delete Space'),
        disabled: true,
        execute: function () {
        }
      },
      {
        name: gettext('Assign User(s)'),
        disabled: true,
        execute: function () {
        }
      }
    ];

    var initPromise;
    var promiseStack = _.get($state.current, 'data.initialized');
    if (promiseStack && promiseStack.length > 1) {
      initPromise = promiseStack[promiseStack.length - 1];
    } else {
      initPromise = $q.when();
    }
    initPromise.then(function () {
      // Present memory usage
      // var usedMemHuman = that.utils.mbToHumanSize(orgDetail.memUsed);
      // var memQuotaHuman = that.utils.mbToHumanSize(orgDetail.memQuota);
      // that.memory = usedMemHuman + ' / ' + memQuotaHuman;

      // Present the user's roles
      that.roles = that.spaceModel.spaceRolesToString(that.spaceDetail().details.roles);
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
