(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addAppWorkflow', addAppWorkflow)
    .run(run);

  addAppWorkflow.$inject = [];

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

  AddAppWorkflowController.$inject = [
    'app.model.modelManager',
    'app.event.eventService',
    'app.utils.utilsService',
    '$interpolate',
    '$scope',
    '$q',
    '$timeout'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the Event management service
   * @param {object} utils - Utils service
   * @param {object} $interpolate - the Angular $interpolate service
   * @param {object} $scope - Angular $scope
   * @param {object} $q - Angular $q service
   * @param {object} $timeout - the Angular $timeout service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   * @property {object} $interpolate - the Angular $interpolate service
   * @property {object} $scope - angular $scope
   * @property {object} $q - angular $q service
   * @property {object} $timeout - the Angular $timeout service
   * @property {boolean} addingApplication - flag for adding app
   * @property {app.model.modelManager} modelManager - the Model management service
   * @property {app.event.eventService} eventService - the Event management service
   * @property {object} appModel - the Cloud Foundry applications model
   * @property {object} serviceInstanceModel - the application service instance model
   * @property {object} spaceModel - the Cloud Foundry space model
   * @property {object} routeModel - the Cloud Foundry route model
   * @property {object} githubModel - the Github model
   * @property {object} hceModel - the HCE model
   * @property {object} privateDomainModel - the private domain model
   * @property {object} sharedDomainModel - the shared domain model
   * @property {object} organizationModel - the organization model
   * @property {object} userInput - user's input about new application
   * @property {object} options - workflow options
   */
  function AddAppWorkflowController(modelManager, eventService, utils, $interpolate, $scope, $q, $timeout) {
    this.$interpolate = $interpolate;
    this.$scope = $scope;
    this.$q = $q;
    this.$timeout = $timeout;
    this.addingApplication = false;
    this.modelManager = modelManager;
    this.eventService = eventService;
    this.utils = utils;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.routeModel = modelManager.retrieve('cloud-foundry.model.route');
    this.privateDomainModel = modelManager.retrieve('cloud-foundry.model.private-domain');
    this.sharedDomainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.userInput = {};
    this.options = {};

    this.init();
  }

  run.$inject = [
    'cloud-foundry.view.applications.workflows.add-pipeline-workflow.prototype'
  ];

  function run(addPipelineWorkflowPrototype) {
    angular.extend(AddAppWorkflowController.prototype, addPipelineWorkflowPrototype, {

      init: function () {
        var that = this;
        var $scope = this.$scope;

        this.stopWatchServiceInstance = $scope.$watch(function () {
          return that.userInput.serviceInstance;
        }, function (serviceInstance) {
          that.userInput.organization = null;
          that.userInput.space = null;
          if (serviceInstance) {
            that.getOrganizations();
            that.getDomains().then(function () {
              that.userInput.domain = that.options.domains[0] && that.options.domains[0].value;
            });
          }
        });

        this.stopWatchOrganization = $scope.$watch(function () {
          return that.userInput.organization;
        }, function (organization) {
          that.userInput.space = null;
          if (organization) {
            that.getSpacesForOrganization(organization.metadata.guid);
          }
        });

        this.stopWatchSpace = $scope.$watch(function () {
          return that.userInput.space;
        }, function (space) {
          if (space) {
            that.getAppsForSpace(space.metadata.guid);
          }
        });

        this.stopWatchSearchCategory = $scope.$watch(function () {
          return that.userInput.searchCategory;
        }, function (newSearchCategory) {
          if (angular.isDefined(that.userInput.search)) {
            that.userInput.search.entity.extra = newSearchCategory === 'all' ? undefined : newSearchCategory;
          }
        });

        this.stopWatchSubflow = $scope.$watch(function () {
          return that.options.subflow;
        }, function (subflow) {
          if (subflow) {
            that.appendSubflow(that.data.subflows[subflow]);
          }
        });

        addPipelineWorkflowPrototype.setWatchers.apply(this);

        // Start the workflow
        this.startWorkflow();
      },

      reset: function () {
        var that = this;

        var path = 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/';
        this.data = {};
        this.errors = {};

        this.userInput = {
          name: null,
          serviceInstance: null,
          clusterUsername: null,
          clusterPassword: null,
          organization: null,
          space: null,
          host: null,
          domain: null,
          application: null,
          hceCnsi: null,
          source: null,
          repo: null,
          repoFilterTerm: null,
          branch: null,
          buildContainer: null,
          projectId: null,
          hcfApiEndpoint: null,
          hcfUserName: null,
          searchCategory: 'all',
          search: {
            entity: {
              extra: undefined
            }
          }
        };

        this.data.workflow = {
          allowJump: false,
          allowBack: false,
          title: gettext('Add Application'),
          btnText: {
            cancel: gettext('Save and Close')
          },
          steps: [
            {
              title: gettext('Name'),
              templateUrl: path + 'name.html',
              formName: 'application-name-form',
              nextBtnText: gettext('Create and continue'),
              cancelBtnText: gettext('Cancel'),
              showBusyOnNext: true,
              onEnter: function () {
                return that.serviceInstanceModel.list()
                  .then(function (serviceInstances) {
                    var validServiceInstances = _.chain(_.values(serviceInstances))
                      .filter({cnsi_type: 'hcf', valid: true})
                      .filter(function (cnsi) {
                        return that.authModel.doesUserHaveRole(cnsi.guid, that.authModel.roles.space_developer);
                      })
                      .map(function (o) {
                        return {label: o.name, value: o};
                      })
                      .value();
                    [].push.apply(that.options.serviceInstances, validServiceInstances);

                    if (!that.options.userInput.serviceInstance &&
                      that.appModel.filterParams.cnsiGuid &&
                      that.appModel.filterParams.cnsiGuid !== 'all') {
                      // Find the option to set. If the user has no permissions this may be null
                      var preSelectedService = _.find(that.options.serviceInstances, { value: { guid: that.appModel.filterParams.cnsiGuid}}) || {};
                      that.options.userInput.serviceInstance = preSelectedService.value;
                    }

                  });
              },
              onNext: function () {
                return that.validateNewRoute().then(function () {
                  return that.createApp().then(function () {
                    var msg = gettext("A new application and route have been created for '{{ appName }}'");
                    that.eventService.$emit('cf.events.NOTIFY_SUCCESS', {
                      message: that.$interpolate(msg)({appName: that.userInput.name})
                    });

                    that.spaceModel.listAllServicesForSpace(
                      that.userInput.serviceInstance.guid,
                      that.userInput.space.metadata.guid
                    )
                    .then(function (services) {
                      that.options.services.length = 0;
                      [].push.apply(that.options.services, services);

                      // retrieve categories that user can filter services by
                      var categories = [];
                      angular.forEach(services, function (service) {
                        // Parse service entity extra data JSON string
                        if (!_.isNil(service.entity.extra) && angular.isString(service.entity.extra)) {
                          service.entity.extra = angular.fromJson(service.entity.extra);

                          if (angular.isDefined(service.entity.extra.categories)) {
                            var serviceCategories = _.map(service.entity.extra.categories,
                                                          function (o) {return { label: o, value: { categories: o }, lower: o.toLowerCase() }; });
                            categories = _.unionBy(categories, serviceCategories, 'lower');
                          }
                        }
                      });
                      categories = _.sortBy(categories, 'lower');
                      that.options.serviceCategories.length = 1;
                      [].push.apply(that.options.serviceCategories, categories);
                    }, function () {
                      that.options.servicesError = true;
                    })
                    .finally(function () {
                      that.options.servicesReady = true;
                    });
                  }, function (error) {
                    var msg = gettext('There was a problem creating your application. ');
                    var cloudFoundryException = that.utils.extractCloudFoundryError(error);
                    if (cloudFoundryException || _.isString(error)) {
                      msg = gettext('The following exception occurred when creating your application: ') + (cloudFoundryException || error) + '. ';
                    }

                    msg = msg + gettext('Please try again or contact your administrator if the problem persists.');

                    return that.$q.reject(msg);
                  });
                });
              }
            },
            {
              title: gettext('Services'),
              formName: 'application-services-form',
              templateUrl: path + 'services.html',
              nextBtnText: gettext('Next'),
              showBusyOnNext: true,
              onNext: function () {
                that.userInput.services = that.appModel.application.summary.services;
                that.options.subflow = that.options.subflow || 'pipeline';
              }
            },
            {
              title: gettext('Delivery'),
              formName: 'application-delivery-form',
              templateUrl: path + 'delivery.html',
              nextBtnText: gettext('Next'),
              showBusyOnNext: true,
              onNext: function () {
                if (that.options.subflow === 'pipeline') {
                  that.options.sources.length = 0;
                  return that.getVcsInstances();
                }
              }
            }
          ]
        };

        this.data.countMainWorkflowSteps = this.data.workflow.steps.length;

        this.data.subflows = {
          pipeline: addPipelineWorkflowPrototype.getWorkflowDefinition.apply(this).steps,
          cli: [
            {
              ready: true,
              title: gettext('Deploy App'),
              templateUrl: path + 'cli-subflow/deploy.html',
              formName: 'application-cli-deploy-form',
              nextBtnText: gettext('Finished'),
              isLastStep: true,
              onEnter: function () {
                that.userInput.hcfApiEndpoint = that.utils.getClusterEndpoint(that.userInput.serviceInstance);

                // Get user name from StackatoInfo
                if (that.stackatoInfo.info) {
                  var endpointUser = that.stackatoInfo.info.endpoints.hcf[that.userInput.serviceInstance.guid].user;
                  if (endpointUser) {
                    that.userInput.hcfUserName = endpointUser.name;
                  }
                }
                return that.$q.resolve();
              }
            }
          ]
        };

        this.options = {
          eventService: this.eventService,
          subflow: null,
          serviceInstances: [],
          services: [],
          serviceCategories: [
            { label: gettext('All Services'), value: 'all' }
          ],
          servicesReady: false,
          organizations: [],
          spaces: [],
          domains: []
        };

        this.setOptions();

        this.addApplicationActions = {
          stop: function () {
            that.stopWorkflow();
          },

          finish: function () {
            that.finishWorkflow();
          }
        };
      },

      /**
       * @function createApp
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description create an application
       * @returns {promise} A resolved/rejected promise
       */
      createApp: function () {
        var that = this;
        var cnsiGuid = this.userInput.serviceInstance.guid;

        return that.appModel.createApp(cnsiGuid, {
          name: that.userInput.name,
          space_guid: that.userInput.space.metadata.guid
        }).then(function (app) {
          var summaryPromise = that.appModel.getAppSummary(cnsiGuid, app.metadata.guid);

          // Add route
          var routeSpec = {
            host: that.userInput.host,
            domain_guid: that.userInput.domain.metadata.guid,
            space_guid: that.userInput.space.metadata.guid
          };

          var routePromise = that.routeModel.createRoute(cnsiGuid, routeSpec)
            .then(function (route) {
              return that.routeModel.associateAppWithRoute(cnsiGuid, route.metadata.guid, app.metadata.guid);
            });

          that.eventService.$emit('cf.events.NEW_APP_CREATED');

          return that.$q.all([summaryPromise, routePromise]).then(function () {
            that.userInput.application = that.appModel.application;
          });
        });
      },

      /**
       * @function validateNewRoute
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description check a route exists
       * @returns {promise} A resolved/rejected promise
       */
      validateNewRoute: function () {
        var that = this;
        return that.routeModel.checkRouteExists(
          that.userInput.serviceInstance.guid,
          that.userInput.domain.metadata.guid,
          that.userInput.host
          )
          .then(function () {
            // Route has been found, this is not a valid route to add
            return that.$q.reject({
              exist: true
            });
          })
          .catch(function (error) {
            if (error.status === 404) {
              // Route has not been found, this is a valid route to add
              return that.$q.resolve();
            }

            if (error.exist) {
              return that.$q.reject(gettext('This route already exists. Choose a new one.'));
            }

            var msg = gettext('There was a problem validating your route. ');
            var cloudFoundryException = that.utils.extractCloudFoundryError(error);
            if (cloudFoundryException || _.isString(error)) {
              msg = gettext('The following exception occurred when validating your route: ') + (cloudFoundryException || error) + '. ';
            }

            msg = msg + gettext('Please try again or contact your administrator if the problem persists.');

            return that.$q.reject(msg);
          });
      },

      /**
       * @function getOrganizations
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description get organizations
       * @returns {promise} A resolved/rejected promise
       */
      getOrganizations: function () {
        var that = this;
        var cnsiGuid = that.userInput.serviceInstance.guid;
        this.options.organizations.length = 0;

        return this.organizationModel.listAllOrganizations(cnsiGuid)
          .then(function (organizations) {
            // Filter out organizations in which user does not
            // have any space where they aren't a developer
            // NOTE: This is unnecessary for admin users, and will fail
            // because the userSummary doesn't contain organization_guid data
            var filteredOrgs = organizations;
            if (!that.authModel.isAdmin(cnsiGuid)) {
              filteredOrgs = _.filter(organizations, function (organization) {
                // Retrieve filtered list of Spaces where the user is a developer
                var orgGuid = organization.metadata.guid;
                var filteredSpaces = _.filter(that.authModel.principal[cnsiGuid].userSummary.spaces.all,
                  {entity: {organization_guid: orgGuid}});
                return filteredSpaces.length > 0;
              });
            }
            [].push.apply(that.options.organizations, _.map(filteredOrgs, that.selectOptionMapping));

            if (!that.options.userInput.organization &&
              that.appModel.filterParams.orgGuid &&
              that.appModel.filterParams.orgGuid !== 'all') {
              // Find the option to set. If the user has no permissions this may be null
              var preSelectedOrg = _.find(that.options.organizations, { value: { metadata: { guid: that.appModel.filterParams.orgGuid}}}) || {};
              that.options.userInput.organization = preSelectedOrg.value;
            }
          });
      },

      /**
       * @function getSpacesForOrganization
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description get spaces for organization
       * @param {string} guid - the organization GUID
       * @returns {promise} A resolved/rejected promise
       */
      getSpacesForOrganization: function (guid) {
        var that = this;
        var cnsiGuid = that.userInput.serviceInstance.guid;
        this.options.spaces.length = 0;

        return this.organizationModel.listAllSpacesForOrganization(cnsiGuid, guid)
          .then(function (spaces) {

            // Filter out spaces in which user is not a Space Developer
            var filteredSpaces = spaces;
            if (!that.authModel.isAdmin(cnsiGuid)) {
              filteredSpaces = _.filter(that.authModel.principal[cnsiGuid].userSummary.spaces.all,
                {entity: {organization_guid: guid}});
            }
            [].push.apply(that.options.spaces, _.map(filteredSpaces, that.selectOptionMapping));

            if (!that.options.userInput.space &&
              that.appModel.filterParams.spaceGuid &&
              that.appModel.filterParams.spaceGuid !== 'all') {
              // Find the option to set. If the user has no permissions this may be null
              var preSelectedOrg = _.find(that.options.spaces, { value: { metadata: { guid: that.appModel.filterParams.spaceGuid}}}) || {};
              that.options.userInput.space = preSelectedOrg.value;
            }
          });
      },

      /**
       * @function getAppsForSpace
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description get apps for space
       * @param {string} guid - the space GUID
       * @returns {promise} A resolved/rejected promise
       */
      getAppsForSpace: function (guid) {
        var that = this;
        var cnsiGuid = that.userInput.serviceInstance.guid;
        return this.spaceModel.listAllAppsForSpace(cnsiGuid, guid)
          .then(function (apps) {
            that.options.apps.length = 0;
            [].push.apply(that.options.apps, _.map(apps, that.selectOptionMapping));
          });
      },

      /**
       * @function getDomains
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description get domains, including private domains and shared domains
       * @returns {promise} A resolved/rejected promise
       */
      getDomains: function () {
        this.options.domains.length = 0;
        return this.$q.all([
          this.getPrivateDomains(),
          this.getSharedDomains()
        ]);
      },

      /**
       * @function getPrivateDomains
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description get private domains
       * @returns {promise} A resolved/rejected promise
       */
      getPrivateDomains: function () {
        var that = this;
        var cnsiGuid = that.userInput.serviceInstance.guid;
        return this.privateDomainModel.listAllPrivateDomains(cnsiGuid).then(function (privateDomains) {
          [].push.apply(that.options.domains, _.map(privateDomains, that.selectOptionMapping));
        });
      },

      /**
       * @function getSharedDomains
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description get shared domains
       * @returns {promise} A resolved/rejected promise
       */
      getSharedDomains: function () {
        var that = this;
        var cnsiGuid = that.userInput.serviceInstance.guid;
        return this.sharedDomainModel.listAllSharedDomains(cnsiGuid).then(function (sharedDomains) {
          [].push.apply(that.options.domains, _.map(sharedDomains, that.selectOptionMapping));
        });
      },

      /**
       * @function redefineWorkflowWithoutHce
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description redefine the workflow if there is no HCE service instances registered
       */
      redefineWorkflowWithoutHce: function () {
        this.options.subflow = 'cli';
        this.data.countMainWorkflowSteps -= 1;
        this.data.workflow.steps.pop();
        [].push.apply(this.data.workflow.steps, this.data.subflows.cli);
      },

      /**
       * @function notify
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description notify success
       */
      notify: function () {
        if (!this.userInput.application) {
          return;
        }

        var params = {
          cnsiGuid: this.userInput.serviceInstance.guid,
          guid: this.userInput.application.summary.guid
        };
        if (this.userInput.projectId) {
          this.eventService.$emit(this.eventService.events.REDIRECT, 'cf.applications.application.delivery-logs', params);
        } else {
          this.eventService.$emit(this.eventService.events.REDIRECT, 'cf.applications.application.summary', params);
        }
      },

      startWorkflow: function () {
        this.addingApplication = true;
        this.reset();
        this.getHceInstances();
      },

      stopWorkflow: function () {
        this.notify();
        this.addingApplication = false;
        this.closeDialog();
      },

      finishWorkflow: function () {
        this.notify();
        this.addingApplication = false;
        this.dismissDialog();
      }
    });
  }

})();
