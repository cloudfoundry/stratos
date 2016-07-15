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
   * @param {object} $scope - the angular $scope service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.utils.utilsService} utils - the console utils service
   */
  function OrganizationSummaryTileController($scope, $stateParams, modelManager, utils) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
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
        }
      },
      {
        name: gettext('Delete Organization'),
        disabled: true,
        execute: function () {
        }
      }
    ];

    $scope.$watch(function () {
      return _.get(that.organizationModel, 'organizations.' + that.clusterGuid + '.' + that.organizationGuid);
    }, function (orgDetail) {
      if (!orgDetail) {
        return;
      }

      // Present memory usage
      var usedMemHuman = that.utils.mbToHumanSize(orgDetail.memUsed);
      var memQuotaHuman = that.utils.mbToHumanSize(orgDetail.memQuota);
      that.memory = usedMemHuman + ' / ' + memQuotaHuman;

      // Present the user's roles
      that.roles = that.organizationModel.organizationRolesToString(orgDetail.roles);
    });
  }

  angular.extend(OrganizationSummaryTileController.prototype, {
  });

})();
