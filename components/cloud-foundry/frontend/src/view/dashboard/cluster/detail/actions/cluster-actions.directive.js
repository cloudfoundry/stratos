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
   * @param {object} $scope - the angular $scope service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $state - the angular $state service
   * @param {object} $q - the angular $q service
   * @param {object} $stateParams - the ui-router $stateParams service
   * @param {object} $translate - the angular $translate service
   * @param {object} appUtilsService - our appUtilsService service
   * @param {object} frameworkAsyncTaskDialog - our async dialog service
   * @param {object} appClusterAssignUsers - service vm allows assigning roles to users
   * @param {object} appUserSelection - service centralizing user selection
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @property {Array} actions - collection of relevant actions vm can be executed against cluster
   */
  function ClusterActionsController($scope, modelManager, $state, $q, $stateParams, $translate, appUtilsService,
                                    frameworkAsyncTaskDialog, appClusterAssignUsers, appUserSelection,
                                    appNotificationsService, cfOrganizationModel) {
    var vm = this;
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    var consoleInfo = modelManager.retrieve('app.model.consoleInfo');

    vm.stateName = $state.current.name;
    vm.clusterGuid = $stateParams.guid;
    // Depending on depth into endpoints these two might be null
    vm.organizationGuid = $stateParams.organization;
    vm.spaceGuid = $stateParams.space;

    function getOrgName(org) {
      return _.get(org, 'details.org.entity.name');
    }

    function getExistingSpaceNames(orgGuid) {
      var orgSpaces = cfOrganizationModel.organizations[vm.clusterGuid][orgGuid].spaces;
      return _.map(orgSpaces, function (space) {
        return space.entity.name;
      });
    }

    var createOrg = {
      name: 'cf.cluster-actions.create-org.action-name',
      disabled: false,
      execute: function () {
        return frameworkAsyncTaskDialog(
          {
            title: 'cf.cluster-actions.create-org.dialog.title',
            templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/actions/create-organization.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'cf.cluster-actions.create-org.dialog.submit-button'
            },
            class: 'dialog-form',
            dialog: true
          },
          {
            data: {
              // Make the form invalid if the name is already taken
              organizationNames: cfOrganizationModel.organizationNames[vm.clusterGuid]
            }
          },
          function (orgData) {
            if (orgData.name && orgData.name.length > 0) {
              return cfOrganizationModel.createOrganization(vm.clusterGuid, orgData.name).then(function () {
                appNotificationsService.notify('success',
                  $translate.instant('cf.cluster-actions.create-org.dialog.success-notification', {name: orgData.name}));
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
      name: 'cf.cluster-actions.create-space.action-name',
      disabled: false,
      execute: function () {

        var existingSpaceNames, selectedOrg;

        // Context-sensitively pre-select the correct organization
        if ($stateParams.organization) {
          selectedOrg = cfOrganizationModel.organizations[vm.clusterGuid][$stateParams.organization];
        } else {
          // Pre-select the most recently created organization
          var sortedOrgs = _.sortBy(cfOrganizationModel.organizations[vm.clusterGuid], function (org) {
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
          organizations: _.map(cfOrganizationModel.organizations[vm.clusterGuid], function (org) {
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
            return authModel.isAllowed(vm.clusterGuid, authModel.resources.space, authModel.actions.create, org.details.guid);
          }
        };

        return frameworkAsyncTaskDialog(
          {
            title: 'cf.cluster-actions.create-space.dialog.title',
            templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/actions/create-space.html',
            submitCommit: true,
            buttonTitles: {
              submit: 'cf.cluster-actions.create-space.dialog.submit-button'
            },
            class: 'space-dialog-form dialog-form',
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
            return spaceModel.createSpaces(vm.clusterGuid, contextData.organization.details.guid, toCreate)
              .then(function () {
                appNotificationsService.notify('success', toCreate.length > 1
                  ? $translate.instant('cf.cluster-actions.create-space.dialog.success-notification-plural', {names: toCreate.join(',')})
                  : $translate.instant('cf.cluster-actions.create-space.dialog.success-notification-singular', {name: toCreate[0]}));
              });
          }
        );
      },
      icon: 'svg:Tree.svg',
      iconClass: 'cluster-action-icon-tree'
    };

    var assignUsers = {
      name: 'cf.cluster-actions.assign-users.action-name',
      disabled: false,
      execute: function () {
        return appClusterAssignUsers.assign({
          clusterGuid: vm.clusterGuid,
          selectedUsers: appUserSelection.getSelectedUsers(vm.clusterGuid)
        });
      },
      icon: 'person_add'
    };

    function enableActions() { // eslint-disable-line complexity
      var isAdmin = consoleInfo.info.endpoints.cf[vm.clusterGuid].user.admin;

      // Organization access - enabled if user is either an admin or the appropriate flag is enabled
      var canCreateOrg = authModel.isAllowed(vm.clusterGuid, authModel.resources.organization, authModel.actions.create);

      var canCreateSpace = false;
      var canAssignUsers = false;
      if (vm.organizationGuid) {
        // We're at least the 'organization' depth of a cluster. Check permissions against it.
        canCreateSpace = authModel.isAllowed(vm.clusterGuid, authModel.resources.space, authModel.actions.create, vm.organizationGuid);
        if (vm.spaceGuid) {
          // We're at least the 'space' depth of a cluster. Check permissions against it.
          canAssignUsers =
            authModel.isAllowed(vm.clusterGuid, authModel.resources.space, authModel.actions.update, vm.spaceGuid, vm.organizationGuid);
        } else {
          // We're at the organization depth, check if user has any space manager roles within it
          canAssignUsers =
            authModel.isAllowed(vm.clusterGuid, authModel.resources.organization, authModel.actions.update, vm.organizationGuid) ||
            _.find(authModel.principal[vm.clusterGuid].userSummary.spaces.managed, { entity: { organization_guid: vm.organizationGuid}});
        }
      } else {
        // We're at the top depth of a cluster, need to check if user has any permissions for orgs/spaces within it.
        canCreateSpace = authModel.principal[vm.clusterGuid].userSummary.organizations.managed.length > 0;
        canAssignUsers =
          authModel.principal[vm.clusterGuid].userSummary.organizations.managed.length > 0 ||
          authModel.principal[vm.clusterGuid].userSummary.spaces.managed.length > 0;
      }

      vm.clusterActions = [];

      if (canCreateOrg) {
        vm.clusterActions.push(createOrg);
      }
      if (canCreateSpace) {
        vm.clusterActions.push(createSpace);
      }
      if (canAssignUsers || isAdmin) {
        vm.clusterActions.push(assignUsers);
      }
      vm.hasActions = !!(vm.clusterActions && vm.clusterActions.length > 0);
    }

    function init() {
      $scope.$watch(function () {
        return _.keys(cfOrganizationModel.organizations[vm.clusterGuid]).length;
      }, function () {
        // Catch case where a new org is added when there were none before, or vice versa
        enableActions();
      });
      return $q.resolve();
    }

    appUtilsService.chainStateResolve(vm.stateName, $state, init);
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
