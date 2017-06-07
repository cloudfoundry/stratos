(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('deleteAppWorkflow', deleteAppWorkflow);

  /**
   * @memberof cloud-foundry.view.applications
   * @name deleteAppWorkflow
   * @description An delete-app-workflow directive
   * @returns {object} The delete-app-workflow directive definition object
   */
  function deleteAppWorkflow() {
    return {
      controller: DeleteAppWorkflowController,
      controllerAs: 'deleteAppWorkflowCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/delete-app-workflow/delete-app-workflow.html',
      scope: {
        closeDialog: '=',
        dismissDialog: '=',
        guids: '='
      },
      bindToController: true
    };
  }

  /**
   * @memberof cloud-foundry.view.applications
   * @name DeleteAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appEventService} appEventService - the Event management service
   * @param {object} $q - angular $q service
   * @param {object} $interpolate - the Angular $interpolate service
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {cfApplicationTabs} cfApplicationTabs - provides collection of configuration objects for tabs on the application page
   * @property {boolean} deletingApplication - a flag indicating if the workflow in progress
   * @property {object} data - a data bag
   * @property {object} userInput - user's input about new application
   */
  function DeleteAppWorkflowController(modelManager, appEventService, $q, $interpolate, appUtilsService,
                                       cfApplicationTabs) {

    var vm = this;

    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var routeModel = modelManager.retrieve('cloud-foundry.model.route');
    var serviceInstanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');
    vm.deletingApplication = false;
    vm.cnsiGuid = null;

    startWorkflow(vm.guids || {});

    vm.reset = reset;
    vm.checkAppRoutes = checkAppRoutes;
    vm.checkAppServices = checkAppServices;
    vm.deleteApp = deleteApp;
    vm.removeAppFromRoutes = removeAppFromRoutes;
    vm.deleteServiceBindings = deleteServiceBindings;
    vm.deleteRouteIfPossible = deleteRouteIfPossible;
    vm.tryDeleteEachRoute = tryDeleteEachRoute;
    vm.deleteProject = deleteProject;
    vm.startWorkflow = startWorkflow;
    vm.stopWorkflow = stopWorkflow;
    vm.finishWorkflow = finishWorkflow;

    function reset() {

      var path = 'plugins/cloud-foundry/view/applications/workflows/delete-app-workflow/';
      vm.cnsiGuid = null;
      vm.data = {};
      vm.userInput = {
        checkedRouteValue: _.keyBy(appModel.application.summary.routes, 'guid'),
        // This will include any pipeline user service.. even through we may not show it we still want it removed
        checkedServiceValue: _.keyBy(appModel.application.summary.services, 'guid')
      };

      vm.data.workflow = {
        initControllers: function (wizard) {
          vm.wizard = wizard;
          wizard.postInitTask.promise.then(function () {
            vm.options.isBusy = true;
            vm.wizard.nextBtnDisabled = true;
            checkAppServices();
            checkAppRoutes().finally(function () {
              vm.wizard.nextBtnDisabled = false;
              vm.options.isBusy = false;
            });
          });
        },
        lastStepCommit: true,
        allowCancelAtLastStep: true,
        hideStepNavStack: true,
        steps: [
          {
            templateUrl: path + 'delete-services-and-routes.html',
            nextBtnText: gettext('Delete app and associated items'),
            isLastStep: true
          }
        ]
      };

      vm.options = {
        workflow: vm.data.workflow,
        userInput: vm.userInput,
        appModel: appModel,
        isBusy: true,
        isDeleting: false,
        hasError: false,
        safeRoutes: [],
        safeServices: []
      };

      vm.deleteApplicationActions = {
        stop: function () {
          stopWorkflow();
        },

        finish: function (wizard) {
          wizard.disableButtons();
          finishWorkflow().catch(function () {
            wizard.resetButtons();
          });
        }
      };
    }

    function checkAppRoutes() {

      vm.options.safeRoutes = [];
      var tasks = [];
      var routes = appModel.application.summary.routes;
      routes.forEach(function (route) {
        tasks.push(routeModel.listAllAppsForRoute(vm.cnsiGuid, route.guid, { 'results-per-page': 1}, true));
      });
      return $q.all(tasks).then(function (results) {
        results.forEach(function (routeInfo, index) {
          // Check that each route is only bound to 1 app (which implicitly must be this app)
          if (routeInfo.total_results === 1) {
            vm.options.safeRoutes.push(routes[index]);
          }
        });
      });
    }

    function checkAppServices() {
      vm.options.safeServices = _.filter(
        appModel.application.summary.services,
        function (o) {
          return o.bound_app_count === 1;
        }
      );
    }

    /**
     * @function deleteApp
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description delete an application
     * @returns {object} A resolved/rejected promise
     */
    function deleteApp() {

      var removeAndDeleteRoutes = removeAppFromRoutes().then(function () {
        return tryDeleteEachRoute();
      });

      // May not be able to delete the project (pipeline user permisions) so ensure we attempt this up front
      return cfApplicationTabs.appDeleting()
        .then(function () {
          return $q.all([
            removeAndDeleteRoutes,
            deleteServiceBindings()
          ]);
        })
        .then(function () {
          return appModel.deleteApp(vm.cnsiGuid, appModel.application.summary.guid);
        })
        .then(function () {
          return cfApplicationTabs.appDeleted();
        });
    }

    /**
     * @function removeAppFromRoutes
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description remove app from all the routes
     * @returns {object} A resolved/rejected promise
     */
    function removeAppFromRoutes() {

      var checkedRouteValue = vm.userInput.checkedRouteValue;
      var appGuid = appModel.application.summary.guid;
      var funcStack = [];

      Object.keys(checkedRouteValue).forEach(function (guid) {
        funcStack.push(function () {
          return routeModel.removeAppFromRoute(vm.cnsiGuid, guid, appGuid);
        });
      });

      return appUtilsService.runInSequence(funcStack);
    }

    /**
     * @function deleteServiceBindings
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description delete all service binding for the app
     * @returns {object} A resolved/rejected promise
     */
    function deleteServiceBindings() {

      var checkedServiceValue = vm.userInput.checkedServiceValue;

      /**
       * service instances that aren't bound to only this app
       * should not be deleted, only unbound
       */
      var serviceInstanceGuids = _.keys(checkedServiceValue);
      if (serviceInstanceGuids.length > 0) {
        return _unbindServiceInstances(serviceInstanceGuids)
          .then(function () {
            var safeServiceInstances = _.chain(checkedServiceValue)
              .filter(function (o) { return o && o.bound_app_count === 1; })
              .map('guid')
              .value();
            return _deleteServiceInstances(safeServiceInstances);
          });
      } else {
        var deferred = $q.defer();
        deferred.resolve();
        return deferred.promise;
      }
    }

    /**
     * @function _unbindServiceInstances
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description Unbind service instance from app
     * @param {array} bindingGuids - the service binding GUIDs
     * @returns {object} A resolved/rejected promise
     */
    function _unbindServiceInstances(bindingGuids) {

      var appGuid = appModel.application.summary.guid;
      var q = 'service_instance_guid IN ' + bindingGuids.join(',');
      return appModel.listServiceBindings(vm.cnsiGuid, appGuid, {q: q})
        .then(function (bindings) {
          var funcStack = [];

          angular.forEach(bindings, function (binding) {
            funcStack.push(function () {
              return appModel.unbindServiceFromApp(vm.cnsiGuid, appGuid, binding.metadata.guid);
            });
          });

          return appUtilsService.runInSequence(funcStack);
        });
    }

    /**
     * @function _deleteServiceInstances
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description Delete service instances
     * @param {array} safeServiceInstances - the service instance GUIDs
     * @returns {object} A resolved/rejected promise
     */
    function _deleteServiceInstances(safeServiceInstances) {
      var funcStack = [];

      angular.forEach(safeServiceInstances, function (serviceInstanceGuid) {
        funcStack.push(function () {
          return _deleteServiceInstanceIfPossible(serviceInstanceGuid);
        });
      });

      return appUtilsService.runInSequence(funcStack);
    }

    /**
     * @function _deleteServiceInstanceIfPossible
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description Delete service instance if possible. Ignore AssociationNotEmpty
     * errors.
     * @param {string} serviceInstanceGuid - the service instance GUID
     * @returns {object} A resolved/rejected promise
     */
    function _deleteServiceInstanceIfPossible(serviceInstanceGuid) {
      return $q(function (resolve, reject) {
        serviceInstanceModel.deleteServiceInstance(vm.cnsiGuid, serviceInstanceGuid)
          .then(resolve, function (response) {
            if (response.data.error_code === 'CF-AssociationNotEmpty') {
              resolve();
            } else {
              reject();
            }
          });
      });
    }

    /**
     * @function deleteRouteIfPossible
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description delete an route if possible
     * @param {string} routeId - the identifier of the route
     * @returns {object} A resolved/rejected promise
     */
    function deleteRouteIfPossible(routeId) {
      return $q(function (resolve, reject) {
        routeModel.listAllAppsForRouteWithoutStore(vm.cnsiGuid, routeId, { 'results-per-page': 1}, true)
          .then(function (apps) {
            if (apps.total_results === 0) {
              routeModel.deleteRoute(vm.cnsiGuid, routeId).then(resolve, reject);
            } else {
              reject();
            }
          });
      });
    }

    /**
     * @function tryDeleteEachRoute
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description try delete each route associated with the application
     * @returns {object} A resolved/rejected promise
     */
    function tryDeleteEachRoute() {
      var checkedRouteValue = _.pickBy(vm.userInput.checkedRouteValue, function (value) { return value; });
      var funcStack = [];

      Object.keys(checkedRouteValue).forEach(function (routeId) {
        funcStack.push(function () {
          return deleteRouteIfPossible(routeId);
        });
      });

      return appUtilsService.runInSequence(funcStack);
    }

    /**
     * @function deleteProject
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description Notify application tabs that the application is
     * @returns {object} A promise
     */
    function deleteProject() {
      return cfApplicationTabs.appDeleting();
    }

    /**
     * @function startWorkflow
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @param {object} data - cnsiGuid and project information
     * @description start workflow
     */
    function startWorkflow(data) {
      vm.deletingApplication = true;
      reset();
      vm.cnsiGuid = data.cnsiGuid;
    }

    /**
     * @function stopWorkflow
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description stop workflow
     */
    function stopWorkflow() {
      vm.deletingApplication = false;
      vm.closeDialog();
    }

    /**
     * @function finishWorkflow
     * @memberOf cloud-foundry.view.applications.DeleteAppWorkflowController
     * @description finish workflow
     * @returns {object} A promise
     */
    function finishWorkflow() {
      var appName = appModel.application.summary.name;
      vm.options.isDeleting = true;
      vm.options.hasError = false;
      return deleteApp().then(function () {
        vm.deletingApplication = false;
        // show notification for successful binding
        var successMsg = gettext("'{{appName}}' has been deleted");
        var message = $interpolate(successMsg)({appName: appName});
        appEventService.$emit('events.NOTIFY_SUCCESS', {message: message});
        appEventService.$emit(appEventService.events.REDIRECT, 'cf.applications.list.gallery-view');
        vm.dismissDialog();
      })
      .catch(function () {
        vm.options.hasError = true;
        return $q.reject();
      })
      .finally(function () {
        vm.options.isDeleting = false;
      });
    }
  }

})();
