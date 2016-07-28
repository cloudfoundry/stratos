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
        organization: '=',
        organizationNames: '='
      },
      controller: OrganizationSummaryTileController,
      controllerAs: 'orgSummaryTileCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/summary-tile/organization-summary-tile.html'
    };
  }

  OrganizationSummaryTileController.$inject = [
    '$scope',
    '$state',
    '$stateParams',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'helion.framework.widgets.dialog.confirm',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name OrganizationSummaryTileController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $state - the angular $scope service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $q - the angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.utils.utilsService} utils - the console utils service
   * @param {object} confirmDialog - our confirmation dialog service
   * @param {object} asyncTaskDialog - our async dialog service
   */
  function OrganizationSummaryTileController($scope, $state, $stateParams, $q,
                                             modelManager, utils, confirmDialog, asyncTaskDialog) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.userServiceInstance = modelManager.retrieve('app.model.serviceInstance.user');

    this.organization = this.organizationModel.organizations[this.clusterGuid][this.organizationGuid];

    this.utils = utils;

    this.cardData = {
      title: gettext('Summary')
    };

    this.getEndpoint = function () {
      return utils.getClusterEndpoint(that.userServiceInstance.serviceInstances[that.clusterGuid]);
    };

    this.keys = function (obj) {
      return _.keys(obj);
    };

    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    var user = stackatoInfo.info.endpoints.hcf[that.clusterGuid].user;
    var isAdmin = user.admin;
    var canDelete = false;
    if (isAdmin) {
      var spacesInOrg = that.organization.spaces;
      canDelete = _.keys(spacesInOrg).length === 0;
    }

    this.actions = [
      {
        name: gettext('Edit Organization'),
        disabled: !isAdmin,
        execute: function () {
          return asyncTaskDialog(
            {
              title: gettext('Edit Organization'),
              templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/edit-organization.html',
              buttonTitles: {
                submit: gettext('Save')
              }
            },
            {
              data: {
                name: that.organization.details.org.entity.name,
                organizationNames: that.organizationNames
              }
            },
            function (orgData) {
              if (orgData.name && orgData.name.length > 0) {
                return that.organizationModel.updateOrganization(that.clusterGuid, that.organizationGuid,
                  {name: orgData.name});
              } else {
                return $q.reject('Invalid Name!');
              }
            }
          );
        }
      },
      {
        name: gettext('Delete Organization'),
        disabled: !canDelete,
        execute: function () {
          confirmDialog({
            title: gettext('Delete Organization'),
            description: gettext('Are you sure you want to delete organization') +
            " '" + that.organization.details.org.entity.name + "' ?",
            buttonText: {
              yes: gettext('Delete'),
              no: gettext('Cancel')
            }
          }).result.then(function () {
            return that.organizationModel.deleteOrganization(that.clusterGuid, that.organizationGuid).then(function () {
              // After a successful delete, go up the breadcrumb tree (the current org no longer exists)
              return $state.go($state.current.ncyBreadcrumb.parent());
            });
          });
        }
      }
    ];

    $scope.$watch(function () {
      return _.get(that.organization, 'details');
    }, function () {
      if (!that.organization.details) {
        return;
      }
      // Present memory usage
      var usedMemHuman = that.utils.mbToHumanSize(that.organization.details.memUsed);
      var memQuotaHuman = that.utils.mbToHumanSize(that.organization.details.memQuota);
      that.memory = usedMemHuman + ' / ' + memQuotaHuman;

    });

    $scope.$watchCollection(function () {
      return _.get(that.organization, '.roles.' + user.guid);
    }, function (roles) {
      // Present the user's roles
      that.roles = that.organizationModel.organizationRolesToString(roles);
    });
  }

})();
