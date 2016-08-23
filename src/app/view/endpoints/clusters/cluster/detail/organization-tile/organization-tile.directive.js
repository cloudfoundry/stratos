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
        organization: '=',
        organizationNames: '='
      },
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/organization-tile/organization-tile.html'
    };
  }

  OrganizationTileController.$inject = [
    'app.model.modelManager',
    '$state',
    '$q',
    '$scope',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.cluster.assignUsers',
    'app.view.notificationsService',
    'helion.framework.widgets.dialog.confirm',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name OrganizationTileController
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $state - the angular $state service
   * @param {object} $q - the angular $q service
   * @param {object} $scope - the angular $scope service
   * @param {object} utils - our utils service
   * @param {object} assignUsers - our assign users slide out service
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {object} confirmDialog - our confirmation dialog service
   * @param {object} asyncTaskDialog - our async dialog service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationTileController(modelManager, $state, $q, $scope, utils, assignUsers, notificationsService,
                                      confirmDialog, asyncTaskDialog) {
    var that = this;
    this.$state = $state;
    this.actions = [];

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    console.log('initialising auth service');
    this.authService = modelManager.retrieve('cloud-foundry.model.auth');

    // Present memory usage
    this.memory = utils.sizeUtilization(this.organization.memUsed, this.organization.memQuota);

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

    var cardData = {};
    this.getCardData = function () {
      cardData.title = that.organization.org.entity.name;
      return cardData;
    };

    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.user = stackatoInfo.info.endpoints.hcf[that.organization.cnsiGuid].user;
    var isAdmin = this.user.admin;
    var canDelete = false;
    if (isAdmin) {
      var spacesInOrg = that.organizationModel.organizations[that.organization.cnsiGuid][that.organization.guid].spaces;
      canDelete = _.keys(spacesInOrg).length === 0;
    }

    var orgPath = that.organizationModel.fetchOrganizationPath(that.organization.cnsiGuid, that.organization.guid);
    $scope.$watchCollection(function () {
      return _.get(that.organizationModel, orgPath + '.roles.' + that.user.guid);
    }, function (roles) {
      // Present the user's roles
      that.roles = that.organizationModel.organizationRolesToStrings(roles);
    });

    setActions();

    function setActions() {
      that.actions.push({
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
                name: that.organization.org.entity.name,
                organizationNames: that.organizationNames
              }
            },
            function (orgData) {
              if (orgData.name && orgData.name.length > 0) {
                return that.organizationModel.updateOrganization(that.organization.cnsiGuid, that.organization.guid,
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
      });
      that.actions.push({
        name: gettext('Delete Organization'),
        disabled: !canDelete,
        execute: function () {
          return confirmDialog({
            title: gettext('Delete Organization'),
            description: gettext('Are you sure you want to delete organization') +
            " '" + that.organization.org.entity.name + "'?",
            buttonText: {
              yes: gettext('Delete'),
              no: gettext('Cancel')
            },
            errorMessage: gettext('Failed to delete organization'),
            callback: function () {
              return that.organizationModel.deleteOrganization(that.organization.cnsiGuid, that.organization.guid)
                .then(function () {
                  notificationsService.notify('success', gettext('Organization \'{{name}}\' successfully deleted'),
                    {name: that.organization.org.entity.name});
                });
            }
          });

        }
      });
      that.actions.push({
        name: gettext('Assign User(s)'),
        disabled: !isAdmin,
        execute: function () {
          assignUsers.assign({
            clusterGuid: that.organization.cnsiGuid,
            organizationGuid: that.organization.guid
          });
        }
      });
    }

  }

})();
