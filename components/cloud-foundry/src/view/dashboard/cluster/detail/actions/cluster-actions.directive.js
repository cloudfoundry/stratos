(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('clusterActions', ClusterActions)
    .directive('uniqueSpaceName', UniqueSpaceName);

  // Define contextData here so it's available to both directives
  var contextData;

  function ClusterActions() {
    return {
      restrict: 'E',
      bindToController: true,
      controller: ClusterActionsController,
      controllerAs: 'clusterActionsCtrl',
      scope: {
        hasActions: '=?'
      },
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/actions/cluster-actions.html'
    };
  }

  /**
   * @name OrganizationTileController
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $state - the angular $state service
   * @param {object} $q - the angular $q service
   * @param {object} $stateParams - the ui-router $stateParams service
   * @param {object} appUtilsService - our appUtilsService service
   * @param {object} frameworkAsyncTaskDialog - our async dialog service
   * @param {object} appClusterAssignUsers - service that allows assigning roles to users
   * @param {object} appUserSelection - service centralizing user selection
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function ClusterActionsController(modelManager, $state, $q, $stateParams, appUtilsService, frameworkAsyncTaskDialog,
                                    appClusterAssignUsers, appUserSelection, appNotificationsService, cfOrganizationModel) {
    var that = this;
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    var consoleInfo = modelManager.retrieve('app.model.consoleInfo');

    this.stateName = $state.current.name;
    this.clusterGuid = $stateParams.guid;
    // Depending on depth into endpoints these two might be null
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;

    function getOrgName(org) {
      return _.get(org, 'details.org.entity.name');
    }

    function getExistingSpaceNames(orgGuid) {
      var orgSpaces = cfOrganizationModel.organizations[that.clusterGuid][orgGuid].spaces;
      return _.map(orgSpaces, function (space) {
        return space.entity.name;
      });
    }

    var createOrg = {
      name: gettext('Create Organization'),
      disabled: false,
      execute: function () {
        return frameworkAsyncTaskDialog(
          {
            title: gettext('Create Organization'),
            templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/actions/create-organization.html',
            submitCommit: true,
            buttonTitles: {
              submit: gettext('Create')
            },
            class: 'dialog-form',
            dialog: true
          },
          {
            data: {
              // Make the form invalid if the name is already taken
              organizationNames: cfOrganizationModel.organizationNames[that.clusterGuid]
            }
          },
          function (orgData) {
            if (orgData.name && orgData.name.length > 0) {
              return cfOrganizationModel.createOrganization(that.clusterGuid, orgData.name).then(function () {
                appNotificationsService.notify('success', gettext('Organisation \'{{name}}\' successfully created'),
                  {name: orgData.name});
              });
            } else {
              return $q.reject('Invalid Name!');
            }

          }
        );
      },
      icon: 'svg:Tree.svg',
      iconClass: 'cluster-action-icon-tree'
    };

    var createSpace = {
      name: gettext('Create Space'),
      disabled: false,
      execute: function () {

        var existingSpaceNames, selectedOrg;

        // Context-sensitively pre-select the correct organization
        if ($stateParams.organization) {
          selectedOrg = cfOrganizationModel.organizations[that.clusterGuid][$stateParams.organization];
        } else {
          // Pre-select the most recently created organization
          var sortedOrgs = _.sortBy(cfOrganizationModel.organizations[that.clusterGuid], function (org) {
            return -org.details.created_at;
          });
          selectedOrg = sortedOrgs[0];
        }

        existingSpaceNames = getExistingSpaceNames(selectedOrg.details.guid);

        function setOrganization() {
          contextData.existingSpaceNames = getExistingSpaceNames(contextData.organization.details.guid);
        }

        function createSpaceDisabled() {
          if (contextData.spaces.length >= 5) {
            return true;
          }
          // Make sure all spaces have a valid name before allowing creating another
          for (var i = 0; i < contextData.spaces.length; i++) {
            var spaceName = contextData.spaces[i];
            if (angular.isUndefined(spaceName) || spaceName.length < 1) {
              return true;
            }
          }
          return false;
        }

        function addSpace() {
          if (createSpaceDisabled()) {
            return;
          }
          contextData.spaces.push('');
        }

        function removeSpace(index) {
          if (contextData.spaces.length < 2) {
            return;
          }
          contextData.spaces.splice(index, 1);
        }

        contextData = {
          organization: selectedOrg,
          organizations: _.map(cfOrganizationModel.organizations[that.clusterGuid], function (org) {
            return {
              label: getOrgName(org),
              value: org
            };
          }),
          existingSpaceNames: existingSpaceNames,
          spaces: [''],
          setOrganization: setOrganization,
          createSpaceDisabled: createSpaceDisabled,
          addSpace: addSpace,
          removeSpace: removeSpace,
          // enable input box if user an org manager for the selected org
          isUserOrgManager: function (org) {
            if (angular.isUndefined(org)) {
              return false;
            }
            return authModel.isAllowed(that.clusterGuid, authModel.resources.space, authModel.actions.create, org.details.guid);
          }
        };

        return frameworkAsyncTaskDialog(
          {
            title: gettext('Create Space'),
            templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/actions/create-space.html',
            submitCommit: true,
            buttonTitles: {
              submit: gettext('Create')
            },
            class: 'space-dialog-form',
            dialog: true
          },
          {
            data: contextData
          },
          function () {
            var toCreate = [];
            for (var i = 0; i < contextData.spaces.length; i++) {
              var name = contextData.spaces[i];
              if (angular.isDefined(name) && name.length > 0) {
                toCreate.push(name);
              }
            }
            if (toCreate.length < 1) {
              return $q.reject('Nothing to create!');
            }
            return spaceModel.createSpaces(that.clusterGuid, contextData.organization.details.guid, toCreate)
              .then(function () {
                appNotificationsService.notify('success', toCreate.length > 1
                  ? gettext('Spaces \'{{names}}\' successfully created')
                  : gettext('Space \'{{name}}\' successfully created'), {name: toCreate[0], names: toCreate.join(',')});
              });
          }
        );
      },
      icon: 'svg:Tree.svg',
      iconClass: 'cluster-action-icon-tree'
    };

    var assignUsers = {
      name: gettext('Assign User(s)'),
      disabled: false,
      execute: function () {
        return appClusterAssignUsers.assign({
          clusterGuid: that.clusterGuid,
          selectedUsers: appUserSelection.getSelectedUsers(that.clusterGuid)
        });
      },
      icon: 'person_add'
    };

    function enableActions() { // eslint-disable-line complexity
      var isAdmin = consoleInfo.info.endpoints.cf[that.clusterGuid].user.admin;

      // Organization access - enabled if user is either an admin or the appropriate flag is enabled
      var canCreateOrg = authModel.isAllowed(that.clusterGuid, authModel.resources.organization, authModel.actions.create);

      var canCreateSpace = false;
      var canAssignUsers = false;
      if (that.organizationGuid) {
        // We're at least the 'organization' depth of a cluster. Check permissions against it.
        canCreateSpace = authModel.isAllowed(that.clusterGuid, authModel.resources.space, authModel.actions.create, that.organizationGuid);
        if (that.spaceGuid) {
          // We're at least the 'space' depth of a cluster. Check permissions against it.
          canAssignUsers =
            authModel.isAllowed(that.clusterGuid, authModel.resources.space, authModel.actions.update, that.spaceGuid, that.organizationGuid);
        } else {
          // We're at the organization depth, check if user has any space manager roles within it
          canAssignUsers =
            authModel.isAllowed(that.clusterGuid, authModel.resources.organization, authModel.actions.update, that.organizationGuid) ||
            _.find(authModel.principal[that.clusterGuid].userSummary.spaces.managed, { entity: { organization_guid: that.organizationGuid}});
        }
      } else {
        // We're at the top depth of a cluster, need to check if user has any permissions for orgs/spaces within it.
        canCreateSpace = authModel.principal[that.clusterGuid].userSummary.organizations.managed.length > 0;
        canAssignUsers =
          authModel.principal[that.clusterGuid].userSummary.organizations.managed.length > 0 ||
          authModel.principal[that.clusterGuid].userSummary.spaces.managed.length > 0;
      }

      that.clusterActions = [];

      if (canCreateOrg) {
        that.clusterActions.push(createOrg);
      }
      if (canCreateSpace) {
        that.clusterActions.push(createSpace);
      }
      if (canAssignUsers || isAdmin) {
        that.clusterActions.push(assignUsers);
      }
      that.hasActions = !!(that.clusterActions && that.clusterActions.length > 0);
    }

    function init() {
      enableActions();
      return $q.resolve();
    }

    appUtilsService.chainStateResolve(this.stateName, $state, init);
  }

  // private validator to ensure there are no duplicates within the list of new names
  function UniqueSpaceName() {
    return {
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        var index = parseInt(attrs.uniqueSpaceName, 10);
        ctrl.$validators.dupeName = function (modelValue) {
          if (ctrl.$isEmpty(modelValue)) {
            return true;
          }
          for (var i = 0; i < contextData.spaces.length; i++) {
            if (index === i) {
              continue;
            }
            var name = contextData.spaces[i];
            if (modelValue === name) {
              return false;
            }
          }
          return true;
        };
      }
    };
  }
})();
