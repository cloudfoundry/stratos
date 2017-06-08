(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addAppWorkflow', addAppWorkflow);

  /**
   * @memberof cloud-foundry.view.applications
   * @name addAppWorkflow
   * @description An add-app-workflow directive
   * @returns {object} The add-app-workflow directive definition object
   */
  function addAppWorkflow() {
    return {
      controller: AddAppWorkflowController,
      controllerAs: 'addAppWorkflowCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-app-workflow.html',
      scope: {
        closeDialog: '=',
        dismissDialog: '='
      },
      bindToController: true
    };
  }

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appEventService} appEventService - the Event management service
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @param {object} $interpolate - the Angular $interpolate service
   * @param {object} $scope - Angular $scope
   * @param {object} $q - Angular $q service
   * @property {boolean} addingApplication - flag for adding app
   * @property {object} userInput - user's input about new application
   * @property {object} options - workflow options
   */
  function AddAppWorkflowController(modelManager, appEventService, appUtilsService, cfOrganizationModel,
                                    $interpolate, $scope, $q) {

    var vm = this;

    vm.addingApplication = false;
    vm.userInput = {};
    vm.options = {};

    vm.reset = reset;
    vm.createApp = createApp;
    vm.validateNewRoute = validateNewRoute;
    vm.getOrganizations = getOrganizations;
    vm.getSpacesForOrganization = getSpacesForOrganization;
    vm.getAppsForSpace = getAppsForSpace;
    vm.getDomains = getDomains;
    vm.getPrivateDomains = getPrivateDomains;
    vm.getSharedDomains = getSharedDomains;
    vm.notify = notify;
    vm.startWorkflow = startWorkflow;
    vm.stopWorkflow = stopWorkflow;
    vm.finishWorkflow = finishWorkflow;
    vm.selectOptionMapping = selectOptionMapping;

    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var routeModel = modelManager.retrieve('cloud-foundry.model.route');
    var privateDomainModel = modelManager.retrieve('cloud-foundry.model.private-domain');
    var sharedDomainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    init();

    function init() {
      vm.stopWatchServiceInstance = $scope.$watch(function () {
        return vm.userInput.serviceInstance;
      }, function (serviceInstance) {
        vm.userInput.organization = null;
        vm.userInput.space = null;
        if (serviceInstance) {
          vm.getOrganizations();
          vm.getDomains().then(function () {
            vm.userInput.domain = vm.options.domains[0] && vm.options.domains[0].value;
          });
        }
      });

      vm.stopWatchOrganization = $scope.$watch(function () {
        return vm.userInput.organization;
      }, function (organization) {
        vm.userInput.space = null;
        if (organization) {
          vm.getSpacesForOrganization(organization.metadata.guid);
        }
      });

      vm.stopWatchSpace = $scope.$watch(function () {
        return vm.userInput.space;
      }, function (space) {
        if (space) {
          vm.getAppsForSpace(space.metadata.guid);
        }
      });

      // Start the workflow
      vm.startWorkflow();
    }

    function reset() {
      var path = 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/';
      vm.data = {};
      vm.errors = {};

      vm.userInput = {
        name: null,
        serviceInstance: null,
        clusterUsername: null,
        clusterPassword: null,
        organization: null,
        space: null,
        host: null,
        domain: null,
        application: null,
        cfApiEndpoint: null,
        cfUserName: null
      };

      vm.data.workflow = {
        hideStepNavStack: true,
        allowJump: false,
        allowBack: false,
        allowCancelAtLastStep: true,
        title: 'add-app-dialog.title',
        lastStepCommit: true,
        btnText: {
          cancel: 'buttons.cancel'
        },
        steps: [
          {
            title: gettext('Name'),
            templateUrl: path + 'add-application.html',
            formName: 'application-name-form',
            nextBtnText: 'buttons.add',
            cancelBtnText: 'buttons.cancel',
            showBusyOnNext: true,
            isLastStep: true,
            onEnter: function () {
              return serviceInstanceModel.list()
                .then(function (serviceInstances) {
                  var validServiceInstances = _.chain(_.values(serviceInstances))
                    .filter({cnsi_type: 'cf', valid: true})
                    .filter(function (cnsi) {
                      return authModel.doesUserHaveRole(cnsi.guid, authModel.roles.space_developer);
                    })
                    .map(function (o) {
                      return {label: o.name, value: o};
                    })
                    .value();
                  [].push.apply(vm.options.serviceInstances, validServiceInstances);

                  if (!vm.options.userInput.serviceInstance &&
                    appModel.filterParams.cnsiGuid &&
                    appModel.filterParams.cnsiGuid !== 'all') {
                    // Find the option to set. If the user has no permissions this may be null
                    var preSelectedService = _.find(vm.options.serviceInstances, {value: {guid: appModel.filterParams.cnsiGuid}}) || {};
                    vm.options.userInput.serviceInstance = preSelectedService.value;
                  }
                });
            },
            onNext: function () {
              return vm.validateNewRoute().then(function () {
                return vm.createApp().then(function () {
                  var msg = gettext("A new application and route have been created for '{{ appName }}'");
                  appEventService.$emit('events.NOTIFY_SUCCESS', {
                    message: $interpolate(msg)({appName: vm.userInput.name})
                  });
                }, function (error) {
                  var msg = gettext('There was a problem creating your application. ');
                  var cloudFoundryException = appUtilsService.extractCloudFoundryError(error);
                  if (cloudFoundryException || _.isString(error)) {
                    msg = gettext('The following exception occurred when creating your application: ') + (cloudFoundryException || error) + '. ';
                  }

                  msg = msg + gettext('Please try again or contact your administrator if the problem persists.');
                  return $q.reject(msg);
                });
              });
            }
          }
        ]
      };

      vm.data.countMainWorkflowSteps = vm.data.workflow.steps.length;

      vm.options = {
        workflow: vm.data.workflow,
        userInput: vm.userInput,
        errors: vm.errors,
        appEventService: appEventService,
        subflow: null,
        serviceInstances: [],
        services: [],
        serviceCategories: [
          {label: gettext('All Services'), value: 'all'}
        ],
        servicesReady: false,
        organizations: [],
        spaces: [],
        domains: [],
        apps: []
      };

      vm.addApplicationActions = {
        stop: function () {
          vm.stopWorkflow();
        },

        finish: function () {
          vm.finishWorkflow();
        }
      };
    }

    /**
     * @function createApp
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description create an application
     * @returns {promise} A resolved/rejected promise
     */
    function createApp() {

      var cnsiGuid = vm.userInput.serviceInstance.guid;

      return appModel.createApp(cnsiGuid, {
        name: vm.userInput.name,
        space_guid: vm.userInput.space.metadata.guid
      }).then(function (app) {
        var summaryPromise = appModel.getAppSummary(cnsiGuid, app.metadata.guid);

        // Add route
        var routeSpec = {
          host: vm.userInput.host,
          domain_guid: vm.userInput.domain.metadata.guid,
          space_guid: vm.userInput.space.metadata.guid
        };

        var routePromise = routeModel.createRoute(cnsiGuid, routeSpec)
          .then(function (route) {
            return routeModel.associateAppWithRoute(cnsiGuid, route.metadata.guid, app.metadata.guid);
          });

        appEventService.$emit('cf.events.NEW_APP_CREATED');

        return $q.all([summaryPromise, routePromise]).then(function () {
          vm.userInput.application = appModel.application;
        });
      });
    }

    /**
     * @function validateNewRoute
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description check a route exists
     * @returns {promise} A resolved/rejected promise
     */
    function validateNewRoute() {

      return routeModel.checkRouteExists(
        vm.userInput.serviceInstance.guid,
        vm.userInput.domain.metadata.guid,
        vm.userInput.host
      )
        .then(function () {
          // Route has been found, this is not a valid route to add
          return $q.reject({
            exist: true
          });
        })
        .catch(function (error) {
          if (error.status === 404) {
            // Route has not been found, this is a valid route to add
            return $q.resolve();
          }

          if (error.exist) {
            return $q.reject(gettext('This route already exists. Choose a new one.'));
          }

          var msg = gettext('There was a problem validating your route. ');
          var cloudFoundryException = appUtilsService.extractCloudFoundryError(error);
          if (cloudFoundryException || _.isString(error)) {
            msg = gettext('The following exception occurred when validating your route: ') + (cloudFoundryException || error) + '. ';
          }

          msg = msg + gettext('Please try again or contact your administrator if the problem persists.');

          return $q.reject(msg);
        });
    }

    /**
     * @function getOrganizations
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get organizations
     * @returns {promise} A resolved/rejected promise
     */
    function getOrganizations() {
      var cnsiGuid = vm.userInput.serviceInstance.guid;
      vm.options.organizations.length = 0;

      return cfOrganizationModel.listAllOrganizations(cnsiGuid)
        .then(function (organizations) {
          // Filter out organizations in which user does not
          // have any space where they aren't a developer
          // NOTE: This is unnecessary for admin users, and will fail
          // because the userSummary doesn't contain organization_guid data
          var filteredOrgs = organizations;
          if (!authModel.isAdmin(cnsiGuid)) {
            filteredOrgs = _.filter(organizations, function (organization) {
              // Retrieve filtered list of Spaces where the user is a developer
              var orgGuid = organization.metadata.guid;
              var filteredSpaces = _.filter(authModel.principal[cnsiGuid].userSummary.spaces.all,
                {entity: {organization_guid: orgGuid}});
              return filteredSpaces.length > 0;
            });
          }
          [].push.apply(vm.options.organizations, _.map(filteredOrgs, vm.selectOptionMapping));

          if (!vm.options.userInput.organization &&
            appModel.filterParams.orgGuid &&
            appModel.filterParams.orgGuid !== 'all') {
            // Find the option to set. If the user has no permissions this may be null
            var preSelectedOrg = _.find(vm.options.organizations, {value: {metadata: {guid: appModel.filterParams.orgGuid}}}) || {};
            vm.options.userInput.organization = preSelectedOrg.value;
          }
        });
    }

    /**
     * @function getSpacesForOrganization
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get spaces for organization
     * @param {string} guid - the organization GUID
     * @returns {promise} A resolved/rejected promise
     */
    function getSpacesForOrganization(guid) {
      var cnsiGuid = vm.userInput.serviceInstance.guid;
      vm.options.spaces.length = 0;

      return cfOrganizationModel.listAllSpacesForOrganization(cnsiGuid, guid)
        .then(function (spaces) {

          // Filter out spaces in which user is not a Space Developer
          var filteredSpaces = spaces;
          if (!authModel.isAdmin(cnsiGuid)) {
            filteredSpaces = _.filter(authModel.principal[cnsiGuid].userSummary.spaces.all,
              {entity: {organization_guid: guid}});
          }
          [].push.apply(vm.options.spaces, _.map(filteredSpaces, vm.selectOptionMapping));

          if (!vm.options.userInput.space &&
            appModel.filterParams.spaceGuid &&
            appModel.filterParams.spaceGuid !== 'all') {
            // Find the option to set. If the user has no permissions this may be null
            var preSelectedOrg = _.find(vm.options.spaces, {value: {metadata: {guid: appModel.filterParams.spaceGuid}}}) || {};
            vm.options.userInput.space = preSelectedOrg.value;
          }
        });
    }

    /**
     * @function getAppsForSpace
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get apps for space
     * @param {string} guid - the space GUID
     * @returns {promise} A resolved/rejected promise
     */
    function getAppsForSpace(guid) {

      var cnsiGuid = vm.userInput.serviceInstance.guid;
      return spaceModel.listAllAppsForSpace(cnsiGuid, guid)
        .then(function (apps) {
          vm.options.apps.length = 0;
          [].push.apply(vm.options.apps, _.map(apps, vm.selectOptionMapping));
        });
    }

    /**
     * @function getDomains
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get domains, including private domains and shared domains
     * @returns {promise} A resolved/rejected promise
     */
    function getDomains() {
      vm.options.domains.length = 0;
      return $q.all([
        vm.getPrivateDomains(),
        vm.getSharedDomains()
      ]);
    }

    /**
     * @function getPrivateDomains
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get private domains
     * @returns {promise} A resolved/rejected promise
     */
    function getPrivateDomains() {
      var cnsiGuid = vm.userInput.serviceInstance.guid;
      return privateDomainModel.listAllPrivateDomains(cnsiGuid).then(function (privateDomains) {
        [].push.apply(vm.options.domains, _.map(privateDomains, vm.selectOptionMapping));
      });
    }

    /**
     * @function getSharedDomains
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get shared domains
     * @returns {promise} A resolved/rejected promise
     */
    function getSharedDomains() {
      var cnsiGuid = vm.userInput.serviceInstance.guid;
      return sharedDomainModel.listAllSharedDomains(cnsiGuid).then(function (sharedDomains) {
        [].push.apply(vm.options.domains, _.map(sharedDomains, vm.selectOptionMapping));
      });
    }

    /**
     * @function notify
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description notify success
     */
    function notify() {
      if (!vm.userInput.application) {
        return;
      }

      var params = {
        cnsiGuid: vm.userInput.serviceInstance.guid,
        guid: vm.userInput.application.summary.guid,
        newlyCreated: true
      };

      appEventService.$emit(appEventService.events.REDIRECT, 'cf.applications.application.summary', params);
    }

    function startWorkflow() {
      vm.addingApplication = true;
      vm.reset();
    }

    function stopWorkflow() {
      vm.notify();
      vm.addingApplication = false;
      vm.closeDialog();
    }

    function finishWorkflow() {
      vm.notify();
      vm.addingApplication = false;
      vm.dismissDialog();
    }

    /**
     * @function selectOptionMapping
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description domain mapping function
     * @param {object} o - an object to map
     * @returns {object} select-option object
     */
    function selectOptionMapping(o) {
      return {
        label: o.entity.name,
        value: o
      };
    }
  }

})();
