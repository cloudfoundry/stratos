(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.detail')
    .directive('organizationSummaryTile', OrganizationSummaryTile);

  OrganizationSummaryTile.$inject = [];

  function OrganizationSummaryTile() {
    return {
      bindToController: {
        clusterGuid: '=',
        organization: '='
      },
      controller: OrganizationSummaryTileController,
      controllerAs: 'orgSummaryTileCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/summary-tile/organization-summary-tile.html'
    };
  }

  OrganizationSummaryTileController.$inject = [
    '$scope',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  /**
   * @name OrganizationSummaryTileController
   * @constructor
   * @param {object} $stateParams - the angular $stateParams service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationSummaryTileController($scope, $stateParams, modelManager, utils) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.orgModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.userServiceInstance = modelManager.retrieve('app.model.serviceInstance.user');

    this.utils = utils;

    this.cardData = {
      title: gettext('Summary')
    };
    this.actions = [
      {
        name: gettext('Edit Organization'),
        disabled: true,
        execute: function () {
          alert('Edit Organization');
        }
      },
      {
        name: gettext('Delete Organization'),
        disabled: true,
        execute: function () {
          alert('Delete Organization');
        }
      }
    ];

    $scope.$watch(function () {
      return _.get(that.orgModel, 'organizations.' + that.clusterGuid + '.' + that.organizationGuid);
    }, function (orgDetail) {
      if (!orgDetail) {
        return;
      }

      // Present memory usage
      var usedMemHuman = that.utils.mbToHumanSize(orgDetail.memUsed);
      var memQuotaHuman = that.utils.mbToHumanSize(orgDetail.memQuota);
      that.memory = usedMemHuman + ' / ' + memQuotaHuman;

      // Present the user's roles
      that.roles = that.orgModel.organizationRolesToString(orgDetail.roles);
    });
  }

  angular.extend(OrganizationSummaryTileController.prototype, {
  });

})();
