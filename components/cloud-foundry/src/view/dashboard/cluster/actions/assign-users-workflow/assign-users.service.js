(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster')
    .factory('appClusterAssignUsers', AssignUserFactory)
    .controller('cloud-foundry.view.dashboard.cluster.assignUsersController', AssignUsersWorkflowController);

  function AssignUserFactory(frameworkDetailView) {
    return {
      /**
       * @memberof appClusterAssignUsers
       * @name assign
       * @constructor
       * @param {object} context - the context for the modal. Used to pass in data
       */
      assign: function (context) {
        return frameworkDetailView(
          {
            detailViewTemplateUrl:
              'plugins/cloud-foundry/view/dashboard/cluster/actions/assign-users-workflow/assign-users.html',
            controller: AssignUsersWorkflowController,
            controllerAs: 'assignUsers'
          },
          context
        );
      }
    };
  }

  /**
   * @memberof cloud-foundry.view.dashboard.cluster
   * @name AssignUsersWorkflowController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $translate - the angular $translate service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} context - the context for the modal. Used to pass in data
   * @param {object} appClusterRolesService - the console roles service. Aids in selecting, assigning and removing roles with the
   * roles table.
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $q - the angular $q service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   */
  function AssignUsersWorkflowController($scope, $translate, modelManager, context, appClusterRolesService,
                                         cfOrganizationModel,$stateParams, $q, $timeout, $uibModalInstance) {
    var that = this;

    this.$uibModalInstance = $uibModalInstance;
    this.$q = $q;
    this.$timeout = $timeout;

    context = context || {};

    this.cfOrganizationModel = cfOrganizationModel;
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var path = 'plugins/cloud-foundry/view/dashboard/cluster/actions/assign-users-workflow/';

    this.data = { };
    this.userInput = { };

    var orgWatch;

    function initialise() {
      that.data.clusterGuid = context.clusterGuid || $stateParams.guid;
      that.data.organizationGuid = context.organizationGuid || $stateParams.organization;
      that.data.spaceGuid = context.spaceGuid || $stateParams.spaceGuid;
      that.data.organizations = [];
      that.data.users = {};
      that.data.usersByGuid = [];

      that.userInput.selectedUsersByGuid = {};
      that.userInput.roles = { };
      if (context.selectedUsers) {
        that.userInput.selectedUsersByGuid = angular.fromJson(angular.toJson(context.selectedUsers));
      }
      that.userInput.selectedUsers = [];
    }

    function initialiseSelect() {
      return (context.initPromise || that.$q.when()).then(function () {
        // Omit any org that we don't have permissions to either edit org or at least one child space
        // Create a collection to support the organization drop down
        var organizations = _.omitBy(that.cfOrganizationModel.organizations[that.data.clusterGuid], function (org) {
          return !that.authModel.isOrgOrSpaceActionableByResource(that.data.clusterGuid, org, that.authModel.actions.update);
        });

        that.data.organizations = _.chain(organizations)
          .map(function (obj) {
            that.userInput.roles[obj.details.org.metadata.guid] = {};
            return {
              label: obj.details.org.entity.name,
              value: obj
            };
          })
          .sortBy('label')
          .value();

        // Fetch a list of all users for this cluster
        return appClusterRolesService.listUsers(that.data.clusterGuid)
          .then(function (users) {
            return _.filter(users, function (user) {
              return user.entity.username;
            });
          })
          .then(function (users) {
            that.data.users = users;
            //Smart table struggles with an object, so keep two versions
            that.data.usersByGuid = _.keyBy(users, 'metadata.guid');
          });
      });
    }

    function organizationChanged(org) {
      that.data.spaces = _.map(org.spaces, function (value) {
        return value;
      });

      // Ensure that any change of role respects various rules determined in the rolesService. Normally this is handled
      // by the roles-table, however if there are no spaces there is no table...
      if (that.data.spaces < 1) {
        //... so for this case manually watch the org roles and make the same request as the table
        if (orgWatch) {
          orgWatch();
        }
        orgWatch = $scope.$watch(function () {
          return that.userInput.roles[org.details.guid].organization;
        }, function () {
          appClusterRolesService.updateRoles(that.userInput.roles[org.details.guid]);
        }, true);
      } else if (orgWatch) {
        orgWatch();
      }

      return $q.when();
    }

    initialise();

    // Options for the wizard controller
    this.options = {
      workflow: {
        allowJump: false,
        allowBack: true,
        allowCancelAtLastStep: true,
        title: 'assign-user-roles.title',
        btnText: {
          cancel: $translate.instant('buttons.cancel'),
          back: $translate.instant('buttons.previous')
        },
        steps: [
          {
            title: 'assign-user-roles.step1.title',
            templateUrl: path + 'select/select-users.html',
            formName: 'select-user-form',
            data: that.data,
            userInput: that.userInput,
            showBusyOnEnter: $translate.instant('assign-user-roles.step1.busy-message'),
            checkReadiness: function () {
              return initialiseSelect();
            },
            onNext: function () {
              // Update into a format we can easily iterate over/manipulate in html
              that.userInput.selectedUsers = _
                .chain(that.userInput.selectedUsersByGuid)
                .reduce(function (result, value, key) {
                  // Filter out any entries not selected (user has toggled checkbox)
                  if (value) {
                    result.push(key);
                  }
                  return result;
                }, [])
                .map(function (guid) {
                  // Convert guid array into array of users
                  return that.data.usersByGuid[guid];
                })
                .value();
              // Set a default organization
              if (!that.userInput.org && that.data.organizationGuid) {
                that.userInput.org = _.find(that.data.organizations, function (org) {
                  return org.value.details.guid === that.data.organizationGuid;
                });
                that.userInput.org = that.userInput.org.value;
              }
              if (!that.userInput.org) {
                that.userInput.org = that.data.organizations[0].value;
              }

              that.options.workflow.steps[1].table.config.users = that.userInput.selectedUsers;

              return organizationChanged(that.userInput.org);
            }
          },
          {
            title: 'assign-user-roles.step2.title',
            templateUrl: path + 'assign/assign-selected-users.html',
            formName: 'assign-selected-form',
            data: that.data,
            userInput: that.userInput,
            nextBtnText: $translate.instant('assign-user-roles.step2.button-yes'),
            stepCommit: true,
            onNext: function () {
              // Make the call to the role service to assign new roles. To do this we need to create the params in the
              // required format.

              // The service expects an object of type obj[orgGuid] = <org roles>
              var selectedOrgGuid = that.userInput.org.details.org.metadata.guid;
              var selectedOrgRoles = _.set({}, selectedOrgGuid, that.userInput.roles[selectedOrgGuid]);

              // The service expects an object of CF user objects keyed by their guid
              var usersByGuid = _.keyBy(that.userInput.selectedUsers, function (user) {
                return user.metadata.guid;
              });

              return appClusterRolesService.assignUsers(context.clusterGuid, usersByGuid, selectedOrgRoles);
            },
            isLastStep: true,
            actions: {
              changeOrganization: function (org) {
                organizationChanged(org);
              },
              keys: function (obj) {
                return _.keys(obj);
              },
              // Helper to enable/disable organisation role checkbox inputs
              canAssignOrgRoles: function (org) {
                if (angular.isUndefined(org)) {
                  return false;
                }
                return that.authModel.isAllowed(context.clusterGuid,
                  that.authModel.resources.organization,
                  that.authModel.actions.update, org.details.guid);
              }
            },
            table: {
              config: {
                clusterGuid: context.clusterGuid,
                orgRoles: appClusterRolesService.organizationRoles,
                spaceRoles: appClusterRolesService.spaceRoles,
                disableOrg: true
              },
              roles: that.userInput.roles
            }
          }
        ]
      }
    };

    // Actions for the wizard controller
    this.actions = {
      stop: function () {
        that.$uibModalInstance.dismiss();
      },

      finish: function () {
        that.$uibModalInstance.close();
      }
    };
  }

})();
