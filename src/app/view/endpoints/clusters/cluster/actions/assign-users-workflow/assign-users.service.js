(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.assignUsers', AssignUserFactory);

  AssignUserFactory.$inject = [
    'helion.framework.widgets.detailView'
  ];

  function AssignUserFactory(detailView) {
    return {
      /**
       * @memberof app.view.endpoints.clusters.cluster.assignUsers
       * @name assign
       * @constructor
       * @param {object} context - the context for the modal. Used to pass in data, specifically selectedUsers and
       * initPromise.
       */
      assign: function (context) {
        return detailView(
          {
            detailViewTemplateUrl:
              'app/view/endpoints/clusters/cluster/actions/assign-users-workflow/assign-users.html',
            controller: AssignUsersWorkflowController,
            controllerAs: 'assignUsers'
          },
          context
        );
      }
    };
  }

  AssignUsersWorkflowController.$inject = [
    'app.model.modelManager',
    'context',
    'app.view.endpoints.clusters.cluster.rolesService',
    '$stateParams',
    '$q',
    '$timeout',
    '$uibModalInstance'
  ];

  /**
   * @memberof app.view.endpoints.clusters.cluster
   * @name AssignUsersWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} context - the context for the modal. Used to pass in data
   * @param {object} rolesService - the console roles service. Aids in selecting, assigning and removing roles with the
   * roles table.
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $q - the angular $q service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   */
  function AssignUsersWorkflowController(modelManager, context, rolesService, $stateParams, $q, $timeout,
                                         $uibModalInstance) {
    var that = this;

    this.$uibModalInstance = $uibModalInstance;
    this.$q = $q;
    this.$timeout = $timeout;

    context = context || {};

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');

    var path = 'app/view/endpoints/clusters/cluster/actions/assign-users-workflow/';

    this.data = { };
    this.userInput = { };

    function initialise() {
      that.data.numberMaxValue = Number.MAX_SAFE_INTEGER;

      that.data.clusterGuid = context.clusterGuid || $stateParams.guid;
      that.data.organizationGuid = context.organizationGuid || $stateParams.organization;
      that.data.spaceGuid = context.spaceGuid || $stateParams.spaceGuid;
      that.data.organizations = [];
      that.data.users = {};
      that.data.usersByGuid = [];

      that.userInput.selectedUsersByGuid = {};
      that.userInput.roles = {
        original: {},
        current: {}
      };
      if (context.selectedUsers) {
        that.userInput.selectedUsersByGuid = angular.fromJson(angular.toJson(context.selectedUsers));
      }
      that.userInput.selectedUsers = [];
    }

    function initialiseSelect() {
      return (context.initPromise || that.$q.when()).then(function () {
        // Create a collection to support the organization drop down
        that.data.organizations = _.chain(that.organizationModel.organizations[that.data.clusterGuid])
          .map(function (obj) {
            that.userInput.roles.current[obj.details.org.metadata.guid] = {};
            return {
              label: obj.details.org.entity.name,
              value: obj
            };
          })
          .sortBy('label')
          .value();

        // Fetch a list of all users for this cluster
        return that.usersModel.listAllUsers(that.data.clusterGuid).then(function (res) {
          that.data.users = res;
          //Smart table struggles with an object, so keep two versions
          that.data.usersByGuid = _.keyBy(res, 'metadata.guid');
        });
      });
    }

    function initialiseAssign() {
      return rolesService.refreshRoles(that.data.clusterGuid, false, true);
    }

    function organizationChanged(org) {
      that.data.spaces = _.map(org.spaces, function (value) {
        return value;
      });
      return $q.when();
    }

    initialise();

    // Options for the wizard controller
    this.options = {
      workflow: {
        allowJump: false,
        allowBack: true,
        allowCancelAtLastStep: true,
        title: gettext('Assign User(s)'),
        btnText: {
          cancel: gettext('Cancel'),
          back: gettext('Previous')
        },
        steps: [
          {
            title: gettext('Select User(s)'),
            templateUrl: path + 'select/select-users.html',
            formName: 'select-user-form',
            data: that.data,
            userInput: that.userInput,
            showBusyOnEnter: gettext('Fetching Users...'),
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

              //TODO: RC To be removed during TEAMFOUR-709
              if (that.userInput.selectedUsers.length > 1) {
                that.$timeout(function () {
                  rolesService.clearOrgs(that.userInput.roles.original);
                  rolesService.clearOrgs(that.userInput.roles.current);
                },2000);
              }

              return organizationChanged(that.userInput.org);
            }
          },
          {
            title: gettext('Assign Roles'),
            templateUrl: path + 'assign/assign-selected-users.html',
            formName: 'assign-selected-form',
            data: that.data,
            userInput: that.userInput,
            checkReadiness: function () {
              return initialiseAssign();
            },
            nextBtnText: gettext('Assign'),
            isLastStep: true,
            actions: {
              selectedUserCount: function () {
                return _.keys(that.userInput.selectedUsers).length;
              },
              changeOrganization: function (org) {
                organizationChanged(org);
              }
            },
            selectedUserListLimit: 10,
            table: {
              config: {
                clusterGuid: context.clusterGuid,
                orgRoles: rolesService.organizationRoles,
                spaceRoles: rolesService.spaceRoles,
                disableOrg: true
              },
              roles: that.userInput.roles.original,
              originalRoles: that.userInput.roles.current
            }
          }
        ]
      }
      // ,
      // userInput: this.userInput
    };

    // Simple mechanism to stop double click on 'assign'. Ideally it would be better to do this via the wizard
    // controller
    this.assigning = false;

    // Actions for the wizard controller
    this.actions = {
      stop: function () {
        that.$uibModalInstance.dismiss();
      },

      finish: function () {
        if (that.assigning) {
          return;
        }
        that.assigning = true;
        function findOrg(org, guid) {
          return guid === that.userInput.org.details.org.metadata.guid;
        }

        var origOrgToSave = _.find(that.userInput.roles.original, findOrg);
        var origToSave = {};
        origToSave[that.userInput.org.details.org.metadata.guid] = origOrgToSave;

        var currentOrgToSave = _.find(that.userInput.roles.current, findOrg);
        var currentToSave = {};
        currentToSave[that.userInput.org.details.org.metadata.guid] = currentOrgToSave;

        var usersByGuid = _.keyBy(that.userInput.selectedUsers, function (user) {
          return user.metadata.guid;
        });
        rolesService.updateUsers(context.clusterGuid, usersByGuid, origToSave, currentToSave)
          .then(function () {
            that.$uibModalInstance.close();
          })
          .catch(function (error) {
            if (_.isArray(error)) {
              that.data.failedAssignForUsers = error;
            }
            throw error;
          })
          .finally(function () {
            that.assigning = false;
          });
      }
    };

  }

})();
