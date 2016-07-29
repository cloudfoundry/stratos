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
    '$scope',
    'app.view.endpoints.clusters.cluster.assignUsers',
    'app.utils.utilsService'
  ];

  /**
   * @name OrganizationSpaceTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $scope - the angular $scope service
   * @param {object} assignUsers - our assign users slide out service
   * @param {object} utils - our utils service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationSpaceTileController($state, $stateParams, modelManager, $scope, assignUsers, utils) {
    var that = this;

    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.$state = $state;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = this.space.metadata.guid;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.orgPath = this.organizationModel.fetchOrganizationPath(this.clusterGuid, this.organizationGuid);
    this.user = stackatoInfo.info.endpoints.hcf[this.clusterGuid].user;

    function init() {
      var canDelete = false;
      var isAdmin = that.user.admin;
      if (isAdmin) {
        var spaceDetail = that.spaceDetail();
        canDelete = spaceDetail.routes.length === 0 &&
          spaceDetail.instances.length === 0 &&
          spaceDetail.apps.length === 0 &&
          spaceDetail.services.length === 0;
      }
      that.actions[1].disabled = !canDelete;
      that.actions[2].disabled = !isAdmin;
    }

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
          return that.spaceModel.deleteSpace(that.clusterGuid, that.organizationGuid, that.spaceGuid);
        }
      },
      {
        name: gettext('Assign User(s)'),
        disabled: true,
        execute: function () {
          assignUsers.assign({
            organizationGuid: that.organizationGuid,
            spaceGuid: that.spaceGuid
          });
        }
      }
    ];

    $scope.$watchCollection(function () {
      return _.get(that.spaceModel, that.spacePath + '.roles.' + that.user.guid);
    }, function (roles) {
      // Present the user's roles
      that.roles = that.spaceModel.spaceRolesToString(roles);
    });

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.detail.spaces', $state, init);

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
