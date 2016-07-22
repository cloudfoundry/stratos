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
      assign: function (initPromise, clusterGuid, orgGuid, spaceGuid, selectedUsers) {
        // config should contain level?
        return detailView(
          {
            detailViewTemplateUrl: 'app/view/endpoints/clusters/cluster/assign-users-workflow/assign-users.html',
            title: gettext('Register Code Engine Endpoint'),
            controller: AssignUsersWorkflowController,
            controllerAs: 'assignUsers'
          },
          {
            initPromise: initPromise,
            clusterGuid: clusterGuid,
            organizationGuid: orgGuid,
            spaceGuid: spaceGuid,
            selectedUsers: selectedUsers
          }
        );
      }
    };
  }

  AssignUsersWorkflowController.$inject = [
    'app.model.modelManager',
    'context',
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
  function AssignUsersWorkflowController(modelManager, context, $scope, $q, $uibModalInstance) {
    var that = this;

    this.$uibModalInstance = $uibModalInstance;

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var usersModel = modelManager.retrieve('cloud-foundry.model.users');

    var path = 'app/view/endpoints/clusters/cluster/assign-users-workflow/';

    this.data = { };
    this.userInput = { };

    function initialise() {

      that.data.numberMaxValue = Number.MAX_SAFE_INTEGER;
      that.data.clusterGuid = context.clusterGuid;
      that.data.organizationGuid = context.organizationGuid;
      that.data.spaceGuid = context.spaceGuid;
      that.data.organizations = [];
      that.data.users = {};
      that.data.usersByGuid = [];

      that.errors = {};

      that.userInput.selectedUsersByGuid = JSON.parse(JSON.stringify(context.selectedUsers)) || {};
      that.userInput.selectedUsers = [];
      that.userInput.selectedUsersVisible = 2;

      return (context.initPromise || that.$q.when()).then(function () {
        that.data.organizations = _.map(organizationModel.organizations[context.clusterGuid], function (obj) {
          return {
            label: obj.details.name,
            value: obj
          };
        });

        return usersModel.listAllUsers(context.clusterGuid).then(function (res) {
          that.data.users = res;
          //Smart table struggles with an object, so keep two versions
          that.data.usersByGuid = _.keyBy(res, 'metadata.guid');
        }).catch(function (err) {
          console.log('todo');
          throw err;
        });
      });
    }

    function organizationChanged(org) {
      that.data.spaces = _.map(org.spaces, function(value, key) {
        return value;
      });
      return $q.when();
    }

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
            checkReadiness: function () {
              return initialise();
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
              that.userInput.org = that.data.organizations[0].value;
              return organizationChanged(that.userInput.org);
            },
            data: that.data,
            userInput: that.userInput,
            actions: {
              keys: function (obj) {
                return _.keys(obj);
              }
            }
          },
          {
            title: gettext('Assign Roles'),
            formName: 'assign-selected-form',
            templateUrl: path + 'assign/assign-selected-users.html',
            nextBtnText: gettext('Assign'),
            checkReadiness: function () {
              var usersModel = modelManager.retrieve('cloud-foundry.model.users');
              return usersModel.listAllUsers(context.clusterGuid).then(function (res) {
                that.data.users = res;
                //Smart table struggles with an object, so keep two versions
                that.data.usersByGuid = _.keyBy(res, 'metadata.guid');
              }).catch(function () {
                console.log('todo');
              });
            },
            onNext: function () {
              console.log('assign roles next');
            },
            isLastStep: true,
            data: that.data,
            userInput: that.userInput,
            actions: {
              keys: function (obj) {
                return _.keys(obj);
              },
              selectedUserCount: function () {
                return _.keys(that.userInput.selectedUsers).length;
              },
              changeOrganization: function (org) {
                organizationChanged(org);
              }
            }
          }
        ]
      },
      userInput: this.userInput,
      errors: this.errors
    };

    this.actions = {
      stop: function () {
        that.stopWorkflow();
      },

      finish: function () {
        that.finishWorkflow();
      }
    };

    // $scope.$watch(function () {
    //   return that.userInput.serviceInstance;
    // }, function (serviceInstance) {
    //   if (serviceInstance) {
    //     that.getOrganizations();
    //     that.getDomains().then(function () {
    //       that.userInput.domain = that.options.domains[0].value;
    //     });
    //   }
    // });

  }

  angular.extend(AssignUsersWorkflowController.prototype, {


    // startWorkflow: function () {
    //   var that = this;
    //   // this.addingApplication = true;
    //   this.reset();
    //   // this.appModel.all();
    //   // this.getHceInstances();
    //   // this.serviceInstanceModel.list()
    //   //   .then(function (serviceInstances) {
    //   //     var validServiceInstances = _.chain(_.values(serviceInstances))
    //   //       .filter('valid')
    //   //       .map(function (o) {
    //   //         return { label: o.api_endpoint.Host, value: o };
    //   //       })
    //   //       .value();
    //   //     [].push.apply(that.options.serviceInstances, validServiceInstances);
    //   //   });
    //   console.log('Start workflow');
    // },

    stopWorkflow: function () {
      // this.addingApplication = false;
      console.log('Stopping workflow');
      this.$uibModalInstance.dismiss();
    },

    finishWorkflow: function () {
      // this.addingApplication = false;
      console.log('Finish workflow');
      this.$uibModalInstance.close('tada');
    }
  });

})();
