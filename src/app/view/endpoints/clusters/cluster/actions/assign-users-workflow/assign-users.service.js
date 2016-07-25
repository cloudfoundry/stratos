(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster').directive('onFilter', function () {
      return {
        require: '^stTable',
        scope: {
          onFilter: '='
        },
        link: function (scope, element, attr, ctrl) {
          if (!scope.onfilter) {
            return;
          }
          scope.$watch(function () {
            return ctrl.tableState().search;
          }, function (newValue, oldValue) {
            //TODO: filter out all, pagination still exists + count on pagination shows all not filtered
            scope.onFilter(ctrl);
          }, true);
        }
      };
    })
    .factory('app.view.endpoints.clusters.cluster.assignUsers', AssignUserFactory);

  AssignUserFactory.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'helion.framework.widgets.detailView'
  ];

  function AssignUserFactory(modelManager, apiManager, detailView) {

    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    var that = this;

    return {
    // {
    //   initPromise: initPromise,
    //   selectedUsers: selectedUsers
    // }
      assign: function (context) {
        // config should contain level?
        return detailView(
          {
            detailViewTemplateUrl: 'app/view/endpoints/clusters/cluster/actions/assign-users-workflow/assign-users.html',
            title: gettext('Register Code Engine Endpoint'),
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
    '$scope',
    '$q',
    '$uibModalInstance'
  ];

  /**
   * @memberof cloud-foundry.view
   * @name AssignUsersWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} $scope - angular $scope
   */
  function AssignUsersWorkflowController(modelManager, context, $stateParams, $scope, $q, $uibModalInstance) {
    var that = this;

    this.$uibModalInstance = $uibModalInstance;
    this.$q = $q;

    context = context || {};

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');

    var path = 'app/view/endpoints/clusters/cluster/actions/assign-users-workflow/';

    this.data = { };
    this.userInput = { };

    function initialise() {
      that.data.numberMaxValue = Number.MAX_SAFE_INTEGER;

      that.data.clusterGuid = context.clusterGuid || $stateParams.guid;// Required
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
      that.userInput.selectedUsersVisible = 2;
    }

    function initialiseSelect() {
      return (context.initPromise || that.$q.when()).then(function () {
        that.data.organizations = _.map(that.organizationModel.organizations[that.data.clusterGuid], function (obj) {
          return {
            label: obj.details.org.entity.name,
            value: obj
          };
        });

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

    this.options = {
      workflow: {
        allowJump: false,
        allowBack: true,
        allowCancelAtLastStep: true,
        title: gettext('Assign User(s)'),
        btnText: {
          cancel: gettext('Cancel')
        },
        steps: [
          {
            title: gettext('Select User(s)'),
            templateUrl: path + 'select/select-users.html',
            formName: 'select-user-form',
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
            },
            data: that.data,
            userInput: that.userInput
            // ,
            // actions: {
            //   keys: function (obj) {
            //     return _.keys(obj);
            //   }
            // }
          },
          {
            title: gettext('Assign Roles'),
            formName: 'assign-selected-form',
            templateUrl: path + 'assign/assign-selected-users.html',
            nextBtnText: gettext('Assign'),
            isLastStep: true,
            data: that.data,
            userInput: that.userInput,
            actions: {
              // keys: function (obj) {
              //   return _.keys(obj);
              // },
              selectedUserCount: function () {
                return _.keys(that.userInput.selectedUsers).length;
              },
              changeOrganization: function (org) {
                organizationChanged(org);
              }
            }
          }
        ]
      }
      // ,
      // userInput: this.userInput
    };

    this.actions = {
      stop: function () {
        that.$uibModalInstance.dismiss();
      },

      finish: function () {
        that.assignUsers().then(function () {
          that.$uibModalInstance.close(that.changes);
        });
      }
    };

  }

  angular.extend(AssignUsersWorkflowController.prototype, {

    assignUsers: function () {
      var that = this;
      that.data.failedAssignForUsers = [];

      // TODO: START ASYNC + DISABLE BUTTONS
      var promises = [];
      _.forEach(this.userInput.selectedUsers, function (user) {
        var promise = that.assignUser(user).catch(function (error) {
          that.data.failedAssignForUsers.push(user.entity.username);
          throw error;
        });
        promises.push(promise);
      });

      return this.$q.all(promises).then(function () {
        // Refresh org cache
        if (that.changes.organization) {
          var orgPath = that.organizationModel.fetchOrganizationPath(that.guid, that.changes.organization);
          var org = _.get(that.organizationModel, orgPath);
          that.organizationModel.getOrganizationDetails(that.guid, org.details.org);
        }

        // Refresh space caches
        if (that.changes.spaces) {
          _.forEach(that.changes.spaces, function (spaceGuid) {
            var spacePath = that.spaceModel.fetchSpacePath(that.guid, spaceGuid);
            var space = _.get(that.spaceModel, spacePath);
            that.spaceModel.getSpaceDetails(that.guid, space.details.space);
          });
        }
      });
    },

    assignUser: function (user) {
      var that = this;
      var promises = [];

      var orgGuid = this.userInput.org.details.guid;
      var userGuid = user.metadata.guid;

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

      return this.$q.all(promises);
    }
  });

})();
