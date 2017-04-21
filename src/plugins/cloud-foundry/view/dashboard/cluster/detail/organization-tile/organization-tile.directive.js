(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('organizationTile', OrganizationTile);

  function OrganizationTile() {
    return {
      bindToController: true,
      controller: OrganizationTileController,
      controllerAs: 'organizationTileCtrl',
      scope: {
        organization: '=',
        organizationNames: '='
      },
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/organization-tile/organization-tile.html'
    };
  }

  /**
   * @name OrganizationTileController
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $state - the angular $state service
   * @param {object} $q - the angular $q service
   * @param {object} $scope - the angular $scope service
   * @param {object} appUtilsService - our appUtilsService service
   * @param {object} appClusterAssignUsers - our assign users slide out service
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {object} frameworkDialogConfirm - our confirmation dialog service
   * @param {object} frameworkAsyncTaskDialog - our async dialog service
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationTileController(modelManager, $state, $q, $scope, appUtilsService, // eslint-disable-line complexity
                                      appClusterAssignUsers, appNotificationsService, frameworkDialogConfirm, frameworkAsyncTaskDialog, cfOrganizationModel) {
    var that = this;
    this.$state = $state;

    this.cfOrganizationModel = cfOrganizationModel;
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    // Present memory usage
    this.memory = appUtilsService.sizeUtilization(this.organization.memUsed, this.organization.memQuota);

    // Present instances utilisation
    var instancesUsed = this.organization.instances;
    var appInstanceQuota = this.organization.instancesQuota;
    if (appInstanceQuota === -1) {
      appInstanceQuota = '∞';
    }
    this.instances = instancesUsed + ' / ' + appInstanceQuota;

    this.summary = function () {
      that.$state.go('endpoint.clusters.cluster.organization.detail.spaces', {organization: that.organization.guid});
    };

    function organizationName() {
      var org = that.cfOrganizationModel.organizations[that.organization.cnsiGuid][that.organization.guid];
      return org ? org.details.org.entity.name : '';
    }

    var cardData = {};
    this.getCardData = function () {
      cardData.title = organizationName();
      return cardData;
    };

    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.user = stackatoInfo.info.endpoints.hcf[that.organization.cnsiGuid].user;
    var spacesInOrg = that.cfOrganizationModel.organizations[that.organization.cnsiGuid][that.organization.guid].spaces;
    var canDelete = _.keys(spacesInOrg).length === 0;

    $scope.$watchCollection(function () {
      var org = that.cfOrganizationModel.fetchOrganization(that.organization.cnsiGuid, that.organization.guid);
      if (org && org.roles && org.roles[that.user.guid]) {
        return org.roles[that.user.guid];
      }
    }, function (roles) {
      // Present the user's roles
      that.roles = that.cfOrganizationModel.organizationRolesToStrings(roles);
    });

    var canEditOrg = authModel.isAllowed(that.organization.cnsiGuid,
      authModel.resources.organization,
      authModel.actions.update,
      that.organization.guid);

    var canDeleteOrg = canDelete && authModel.isAllowed(that.organization.cnsiGuid,
        authModel.resources.organization,
        authModel.actions.delete,
        that.organization.guid);

    var isSpaceManager = false;
    // Iterate through all spaces in the organization to determine if user is a space manager
    for (var i = 0; i < that.organization.org.entity.spaces.length; i++) {
      var space = that.organization.org.entity.spaces[i];
      if (authModel.isAllowed(that.organization.cnsiGuid,
          authModel.resources.space,
          authModel.actions.update,
          space.metadata.guid,
          space.entity.organization_guid,
          true)) {

        isSpaceManager = true;
        break;
      }
    }

    // Cannot delete if user is:
    // 1. Not allowed to update the organization (not an admin or an org-manager)
    // 2. and not a manager of any space within the organization in question
    var canAssignUsers = authModel.isAllowed(that.organization.cnsiGuid,
        authModel.resources.organization,
        authModel.actions.update,
        that.organization.guid) || isSpaceManager;

    var editOrgAction = {
      name: gettext('Edit Organization'),
      disabled: !canEditOrg,
      execute: function () {
        return frameworkAsyncTaskDialog(
          {
            title: gettext('Edit Organization'),
            templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/actions/edit-organization.html',
            submitCommit: true,
            buttonTitles: {
              submit: gettext('Save')
            },
            class: 'dialog-form',
            dialog: true
          },
          {
            data: {
              name: organizationName(),
              organizationNames: that.organizationNames
            }
          },
          function (orgData) {
            if (orgData.name && orgData.name.length > 0) {
              if (organizationName() === orgData.name) {
                return $q.resolve();
              }
              return that.cfOrganizationModel.updateOrganization(that.organization.cnsiGuid, that.organization.guid,
                {name: orgData.name})
                .then(function () {
                  appNotificationsService.notify('success', gettext('Organization \'{{name}}\' successfully updated'),
                    {name: orgData.name});
                });
            } else {
              return $q.reject('Invalid Name!');
            }
          }
        );
      }
    };

    var deleteOrgAction = {
      name: gettext('Delete Organization'),
      disabled: !canDeleteOrg,
      execute: function () {
        return frameworkDialogConfirm({
          title: gettext('Delete Organization'),
          description: gettext('Are you sure you want to delete organization') + " '" + organizationName() + "'?",
          submitCommit: true,
          buttonText: {
            yes: gettext('Delete'),
            no: gettext('Cancel')
          },
          errorMessage: gettext('Failed to delete organization'),
          callback: function () {
            var orgName = organizationName();
            return that.cfOrganizationModel.deleteOrganization(that.organization.cnsiGuid, that.organization.guid)
              .then(function () {
                appNotificationsService.notify('success', gettext('Organization \'{{name}}\' successfully deleted'),
                  {name: orgName});
              });
          }
        });

      }
    };

    var assignUsersAction = {
      name: gettext('Assign User(s)'),
      disabled: !canAssignUsers,
      execute: function () {
        appClusterAssignUsers.assign({
          clusterGuid: that.organization.cnsiGuid,
          organizationGuid: that.organization.guid
        });
      }
    };

    that.actions = [];
    if (canEditOrg || this.user.admin) {
      that.actions.push(editOrgAction);
    }
    if (canDeleteOrg || this.user.admin) {
      that.actions.push(deleteOrgAction);
    }
    if (canAssignUsers || this.user.admin) {
      that.actions.push(assignUsersAction);
    }

    if (that.actions.length < 1) {
      delete that.actions;
    }
  }

})();
