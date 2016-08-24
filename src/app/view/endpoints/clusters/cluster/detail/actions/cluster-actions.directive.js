(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('clusterActions', ClusterActions)
    .directive('uniqueSpaceName', UniqueSpaceName);

  // Define contextData here so it's available to both directives
  var contextData;

  ClusterActions.$inject = [];

  function ClusterActions() {
    return {
      restrict: 'E',
      bindToController: true,
      controller: ClusterActionsController,
      controllerAs: 'clusterActionsCtrl',
      scope: {
        // stateName: '@'
        context: '@'
      },
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/cluster-actions.html'
    };
  }

  ClusterActionsController.$inject = [
    'app.model.modelManager',
    '$state',
    '$q',
    '$stateParams',
    'app.utils.utilsService',
    'helion.framework.widgets.asyncTaskDialog',
    'app.view.endpoints.clusters.cluster.assignUsers',
    'app.view.userSelection',
    'app.view.notificationsService'
  ];

  /**
   * @name OrganizationTileController
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $state - the angular $state service
   * @param {object} $q - the angular $q service
   * @param {object} $stateParams - the ui-router $stateParams service
   * @param {object} utils - our utils service
   * @param {object} asyncTaskDialog - our async dialog service
   * @param {object} assignUsersService - service that allows assigning roles to users
   * @param {object} userSelection - service centralizing user selection
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function ClusterActionsController(modelManager, $state, $q, $stateParams,
                                    utils, asyncTaskDialog, assignUsersService, userSelection, notificationsService) {
    var that = this;
    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var authService = modelManager.retrieve('cloud-foundry.model.auth');

    this.stateName = $state.current.name;
    this.clusterGuid = $stateParams.guid;

    function getOrgName(org) {
      return _.get(org, 'details.org.entity.name');
    }

    function getExistingSpaceNames(orgGuid) {
      var orgSpaces = organizationModel.organizations[that.clusterGuid][orgGuid].spaces;
      return _.map(orgSpaces, function (space) {
        return space.entity.name;
      });
    }

    var createOrg = {
      name: gettext('Create Organization'),
      disabled: true,
      execute: function () {
        return asyncTaskDialog(
          {
            title: gettext('Create Organization'),
            templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/create-organization.html',
            buttonTitles: {
              submit: gettext('Create')
            }
          },
          {
            data: {
              // Make the form invalid if the name is already taken
              organizationNames: organizationModel.organizationNames[that.clusterGuid]
            }
          },
          function (orgData) {
            if (orgData.name && orgData.name.length > 0) {
              return organizationModel.createOrganization(that.clusterGuid, orgData.name).then(function () {
                notificationsService.notify('success', gettext('Organisation \'{{name}}\' successfully created'),
                  {name: orgData.name});
              });
            } else {
              return $q.reject('Invalid Name!');
            }

          }
        );
      },
      icon: 'helion-icon-lg helion-icon helion-icon-Tree'
    };

    var createSpace = {
      name: gettext('Create Space'),
      disabled: true,
      execute: function () {

        var existingSpaceNames, selectedOrg;

        // Context-sensitively pre-select the correct organization
        if ($stateParams.organization) {
          selectedOrg = organizationModel.organizations[that.clusterGuid][$stateParams.organization];
        } else {
          // Pre-select the most recently created organization
          var sortedOrgs = _.sortBy(organizationModel.organizations[that.clusterGuid], function (org) {
            return -org.details.created_at;
          });
          selectedOrg = sortedOrgs[0];
        }

        existingSpaceNames = getExistingSpaceNames(selectedOrg.details.guid);

        function setOrganization() {
          contextData.existingSpaceNames = getExistingSpaceNames(contextData.organization.details.guid);
        }

        function createSpaceDisabled() {
          if (contextData.spaces.length >= 10) {
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

        function removeSpace() {
          contextData.spaces.length--;
        }

        contextData = {
          organization: selectedOrg,
          organizations: _.map(organizationModel.organizations[that.clusterGuid], function (org) {
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
          removeSpace: removeSpace
        };

        return asyncTaskDialog(
          {
            title: gettext('Create Space'),
            templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/create-space.html',
            buttonTitles: {
              submit: gettext('Create')
            }
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
                notificationsService.notify('success', toCreate.length > 1
                  ? gettext('Spaces \'{{names}}\' successfully created')
                  : gettext('Space \'{{name}}\' successfully created'), {name: toCreate[0], names: toCreate.join(',')});
              });
          }
        );
      },
      icon: 'helion-icon-lg helion-icon helion-icon-Tree'
    };

    var assignUsers = {
      name: gettext('Assign User(s)'),
      disabled: true,
      execute: function () {
        return assignUsersService.assign({
          clusterGuid: that.clusterGuid,
          selectedUsers: userSelection.getSelectedUsers(that.clusterGuid)
        });
      },
      icon: 'helion-icon-lg helion-icon helion-icon-Add_user'
    };

    this.clusterActions = [
      createOrg,
      createSpace,
      assignUsers
    ];

    /**
     * Enable actions based on admin status
     * N.B. when finer grain ACLs are wired in this should be updated
     * */
    function enableActions() {

      // Organization access - enabled is user is either admin or the appropriate flag is enabled
      that.clusterActions[0].disabled = !authService.isAllowed('organization', 'create');

      // Space access - if user is an Org Manager in at least one organization then show slide in
      that.clusterActions[1].disabled = !authService.principal.userSummary.organizations.managed.length > 0;

      // User Assignment access - if user is an Org Manager in at least one organization then show slide in
      that.clusterActions[2].disabled = !authService.principal.userSummary.organizations.managed;

    }

    function init() {
      enableActions();
      return $q.resolve();
    }

    // Ensure the parent state is fully initialised before we start our own init
    if (this.context !== 'space'){
      utils.chainStateResolve('endpoint.clusters.cluster.detail', $state, init);
    } else {
      utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail', $state, init);
    }
  }

  UniqueSpaceName.$inject = [];

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
