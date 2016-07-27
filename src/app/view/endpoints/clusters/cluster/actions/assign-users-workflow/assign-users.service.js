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
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $q - the angular $q service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   */
  function AssignUsersWorkflowController(modelManager, context, $stateParams, $q, $timeout, $uibModalInstance) {
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
              return organizationChanged(that.userInput.org);
            }
          },
          {
            title: gettext('Assign Roles'),
            templateUrl: path + 'assign/assign-selected-users.html',
            formName: 'assign-selected-form',
            data: that.data,
            userInput: that.userInput,
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
            selectedUserListLimit: 10
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
        that.assignUsers()
          .then(function () {
            that.$uibModalInstance.close(that.changes);
          })
          .finally(function () {
            that.assigning = false;
          });
      }
    };

  }

  angular.extend(AssignUsersWorkflowController.prototype, {

    /**
     * @name AssignUsersWorkflowController.assignUsers
     * @description Assign the controllers selected users with the selected roles. If successful refresh the cache of
     * the affected organizations and spaces
     * @returns {promise}
     */
    assignUsers: function () {
      var that = this;
      that.data.failedAssignForUsers = [];

      // For each user assign their new roles. Do this asynchronously
      var promises = [];
      _.forEach(this.userInput.selectedUsers, function (user) {
        var promise = that.assignUser(user).catch(function (error) {
          that.data.failedAssignForUsers.push(user.entity.username);
          throw error;
        });
        promises.push(promise);
      });

      // If all async requests have finished invalidate any cache associated with roles
      return this.$q.all(promises).then(function () {
        // Refresh org cache
        if (that.changes.organization) {
          var orgPath = that.organizationModel.fetchOrganizationPath(that.data.clusterGuid, that.changes.organization);
          var org = _.get(that.organizationModel, orgPath);
          that.organizationModel.getOrganizationDetails(that.data.clusterGuid, org.details.org);
        }

        // Refresh space caches
        if (that.changes.spaces) {
          _.forEach(that.changes.spaces, function (spaceGuid) {
            var spacePath = that.spaceModel.fetchSpacePath(that.data.clusterGuid, spaceGuid);
            var space = _.get(that.spaceModel, spacePath);
            that.spaceModel.getSpaceDetails(that.data.clusterGuid, space.details.space);
          });
        }
      });
    },

    /**
     * @name AssignUsersWorkflowController.assignUser
     * @description Assign the user's selected roles. If successful refresh the cache of the affected organizations and
     * spaces
     * @param {object} user - the HCF user object of the user to assign roles to
     * @returns {promise}
     */
    assignUser: function (user) {
      var that = this;
      var promises = [];

      var orgGuid = this.userInput.org.details.guid;
      var userGuid = user.metadata.guid;

      // Track which orgs and spaces were affected
      that.changes = {
        organization: false,
        spaces: []
      };

      // Organization roles
      var orgRoles = _.get(this.userInput, 'roles.organization[' + orgGuid + ']', {});
      if (orgRoles[0] || orgRoles[1] || orgRoles[2]) {
        // Track the single org that's changed
        that.changes.organization = orgGuid;
        // Attempt to assign roles in parallel
        var promise = this.usersModel.associateOrganizationWithUser(that.data.clusterGuid, orgGuid, userGuid)
          .then(function () {
            if (orgRoles[0]) {
              promises.push(that.usersModel.associateManagedOrganizationWithUser(that.data.clusterGuid, orgGuid, userGuid));
            }
            if (orgRoles[1]) {
              promises.push(that.usersModel.associateAuditedOrganizationWithUser(that.data.clusterGuid, orgGuid, userGuid));
            }
            if (orgRoles[2]) {
              promises.push(that.usersModel.associateBillingManagedOrganizationWithUser(that.data.clusterGuid, orgGuid, userGuid));
            }
          });
        promises.push(promise);
      }

      // Space roles
      var orgSpaceRoles = _.get(this.userInput, 'roles.space[' + orgGuid + ']', {});
      _.forEach(orgSpaceRoles, function (roles, spaceGuid) {
        // Track which spaces have changed
        if (roles[0] || roles[1] || roles[2]) {
          that.changes.spaces.push(spaceGuid);
        }
        // Attempt to assign roles in parallel
        if (roles[0]) {
          promises.push(that.usersModel.associateManagedSpaceWithUser(that.data.clusterGuid, spaceGuid, userGuid));
        }
        if (roles[1]) {
          promises.push(that.usersModel.associateSpaceWithUser(that.data.clusterGuid, spaceGuid, userGuid));
        }
        if (roles[2]) {
          promises.push(that.usersModel.associateAuditedSpaceWithUser(that.data.clusterGuid, spaceGuid, userGuid));
        }
      });

      // Return a promise when we've 'finished'. This includes some grace between returning from these put requests and
      // the result being available in get requests
      promises.push(that.$timeout(_.noop, 750));

      return this.$q.all(promises);
    }
  });

})();
