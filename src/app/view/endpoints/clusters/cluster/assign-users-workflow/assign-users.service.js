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
      assign: function (clusterGuid, orgGuid, spaceGuid, selectedUsers) {
        // config should contain level?
        return detailView(
          {
            detailViewTemplateUrl: 'app/view/endpoints/clusters/cluster/assign-users-workflow/assign-users.html',
            title: gettext('Register Code Engine Endpoint'),
            controller: AssignUsersWorkflowController,
            controllerAs: 'assignUsers'
          },
          {
            clusterGuid: clusterGuid,
            orgGuid: orgGuid,
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

    this.$scope = $scope;
    this.$q = $q;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');

    var path = 'app/view/endpoints/clusters/cluster/assign-users-workflow/';

    this.data = {};
    this.errors = {};

    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.usersModel.listAllUsers(context.clusterGuid).then(function (res) {
      that.data.users = res;
    }).catch(function () {
      console.log('todo');
    });

    console.log(context.selectedUsers);
    this.userInput = {
      selectedUsers: JSON.parse(JSON.stringify(context.selectedUsers)) || {}
    };

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
            onNext: function () {
              console.log('select usersnext');
              return $q.when('selected users');
            },
            data: that.data,
            userInput: this.userInput
          },
          {
            title: gettext('Assign Roles'),
            formName: 'assign-selected-form',
            templateUrl: path + 'assign/assign-selected-users.html',
            nextBtnText: gettext('Assign'),
            onNext: function () {
              console.log('assign roles next');
            },
            isLastStep: true,
            data: that.data,
            userInput: this.userInput
          }
        ]
      },
      userInput: this.userInput,
      errors: this.errors
    };
    console.log(this.options.workflow.steps[0].selectedUsers);

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
