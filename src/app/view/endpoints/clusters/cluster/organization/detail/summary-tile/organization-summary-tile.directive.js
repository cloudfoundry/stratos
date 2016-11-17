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
    'app.view.notificationsService',
    'app.view.endpoints.clusters.cluster.cliCommands',
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
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {app.view.endpoints.clusters.cluster.cliCommands} cliCommands - service to show cli command slide out
   * @param {object} confirmDialog - our confirmation dialog service
   * @param {object} asyncTaskDialog - our async dialog service
   */
  function OrganizationSummaryTileController($scope, $state, $stateParams, $q, modelManager, utils,
                                             notificationsService, cliCommands, confirmDialog, asyncTaskDialog) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.userServiceInstance = modelManager.retrieve('app.model.serviceInstance.user');

    this.organization = this.organizationModel.organizations[this.clusterGuid][this.organizationGuid];
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

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

    this.showCliCommands = function () {
      cliCommands.show(that.getEndpoint(), that.userName, that.clusterGuid, that.organization);
    };

    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    var user = stackatoInfo.info.endpoints.hcf[that.clusterGuid].user;
    that.isAdmin = user.admin;
    that.userName = user.name;

    var renameAction = {
      name: gettext('Edit Organization'),
      disabled: true,
      execute: function () {
        return asyncTaskDialog(
          {
            title: gettext('Edit Organization'),
            templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/edit-organization.html',
            buttonTitles: {
              submit: gettext('Save')
            },
            class: 'detail-view-thin'
          },
          {
            data: {
              name: that.organization.details.org.entity.name,
              organizationNames: that.organizationNames
            }
          },
          function (orgData) {
            if (orgData.name && orgData.name.length > 0) {
              if (that.organization.details.org.entity.name === orgData.name) {
                return $q.resolve();
              }
              return that.organizationModel.updateOrganization(that.clusterGuid, that.organizationGuid,
                {name: orgData.name})
                .then(function () {
                  notificationsService.notify('success', gettext('Organization \'{{name}}\' successfully updated'),
                    {name: orgData.name});
                });
            } else {
              return $q.reject('Invalid Name!');
            }
          }
        );
      }
    };

    var deleteAction = {
      name: gettext('Delete Organization'),
      disabled: true,
      execute: function () {
        confirmDialog({
          title: gettext('Delete Organization'),
          description: gettext('Are you sure you want to delete organization') +
          " '" + that.organization.details.org.entity.name + "'?",
          buttonText: {
            yes: gettext('Delete'),
            no: gettext('Cancel')
          },
          errorMessage: gettext('Failed to delete organization'),
          callback: function () {
            var name = that.organization.details.org.entity.name;
            return that.organizationModel.deleteOrganization(that.clusterGuid, that.organizationGuid)
              .then(function () {
                notificationsService.notify('success', gettext('Organization \'{{name}}\' successfully deleted'),
                  {name: name});
                // After a successful delete, go up the breadcrumb tree (the current org no longer exists)
                return $state.go($state.current.ncyBreadcrumb.parent());
              });
          }
        });
      }
    };

    function enableActions() {
      that.actions = [];

      var canUpdate = authModel.isAllowed(that.clusterGuid, authModel.resources.organization, authModel.actions.update,
        that.organization.details.guid);
      if (canUpdate || that.isAdmin) {
        renameAction.disabled = false;
        that.actions.push(renameAction);
      }

      var canDelete = authModel.isAllowed(that.clusterGuid, authModel.resources.organization,
        authModel.actions.delete, that.organization.details.guid);
      if (canDelete || that.isAdmin) {
        deleteAction.disabled = _.keys(that.organization.spaces).length !== 0;
        that.actions.push(deleteAction);
      }

      if (that.actions.length < 1) {
        delete that.actions;
      }
    }

    $scope.$watch(function () {
      if (that.organization) {
        return that.organization.details;
      }
    }, function () {
      if (!that.organization.details) {
        return;
      }
      // Present memory usage
      that.memory = that.utils.sizeUtilization(that.organization.details.memUsed, that.organization.details.memQuota);

    });

    $scope.$watchCollection(function () {
      if (that.organization && that.organization.roles) {
        return that.organization.roles[user.guid];
      }
    }, function (roles) {
      // Present the user's roles
      that.roles = that.organizationModel.organizationRolesToStrings(roles);
    });

    function init() {
      // Update delete action when number of spaces changes (requires authService which depends on chainStateResolve)
      $scope.$watchCollection(function () {
        return that.organization.spaces;
      }, function () {
        enableActions();
      });

      return $q.resolve();
    }

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('clusters.cluster.organization.detail', $state, init);
  }

})();
