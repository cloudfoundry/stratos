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
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-app-workflow.html'
    };
  }

  AddAppWorkflowController.$inject = [
    'app.model.modelManager',
    'app.event.eventService',
    'github.view.githubOauthService',
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
   * @param {object} githubOauthService - github oauth service
   * @param {object} $scope - Angular $scope
   * @param {object} $q - Angular $q service
   * @param {object} $timeout - the Angular $timeout service
   * @property {object} $scope - angular $scope
   * @property {object} $q - angular $q service
   * @property {object} $timeout - the Angular $timeout service
   * @property {boolean} addingApplication - flag for adding app
   * @property {app.event.eventService} eventService - the Event management service
   * @property {github.view.githubOauthService} githubOauthService - github oauth service
   * @property {object} appModel - the Cloud Foundry applications model
   * @property {object} cnsiModel - the CNSI model
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
  function AddAppWorkflowController(modelManager, eventService, githubOauthService, $scope, $q, $timeout) {
    var that = this;

    this.$scope = $scope;
    this.$q = $q;
    this.$timeout = $timeout;
    this.addingApplication = false;
    this.eventService = eventService;
    this.githubOauthService = githubOauthService;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.routeModel = modelManager.retrieve('cloud-foundry.model.route');
    this.githubModel = modelManager.retrieve('cloud-foundry.model.github');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.privateDomainModel = modelManager.retrieve('cloud-foundry.model.private-domain');
    this.sharedDomainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.eventService.$on('cf.events.START_ADD_APP_WORKFLOW', function () {
      that.startWorkflow();
    });

    this.userInput = {};
    this.options = {};
    this.filterTimeout = null;

    $scope.$watch(function () {
      return that.userInput.serviceInstance;
    }, function (serviceInstance) {
      if (serviceInstance) {
        that.getOrganizations();
        that.getDomains().then(function () {
          that.userInput.domain = that.options.domains[0].value;
        });
      }
    });

    $scope.$watch(function () {
      return that.userInput.organization;
    }, function (organization) {
      if (organization) {
        that.getSpacesForOrganization(organization.metadata.guid);
      }
    });

    $scope.$watch(function () {
      return that.userInput.space;
    }, function (space) {
      if (space) {
        that.getAppsForSpace(space.metadata.guid);
      }
    });

    $scope.$watch(function () {
      return that.userInput.searchCategory;
    }, function (newSearchCategory) {
      if (angular.isDefined(that.userInput.search)) {
        that.userInput.search.entity.extra = newSearchCategory === 'all' ? undefined : newSearchCategory;
      }
    });

    $scope.$watch(function () {
      return that.options.subflow;
    }, function (subflow) {
      if (subflow) {
        that.appendSubflow(that.data.subflows[subflow]);
      }
    });

    $scope.$watch(function () {
      return that.userInput.repoFilterTerm;
    }, function (newFilterTerm) {
      if (that.filterTimeout !== null) {
        that.$timeout.cancel(that.filterTimeout);
      }

      that.filterTimeout = that.$timeout(function () {
        return that.filterRepos(newFilterTerm);
      }, 500);
    });

    this.eventService.$on('cf.events.LOAD_MORE_REPOS', function () {
      that.loadMoreRepos();
    });
  }

  function run() {
    angular.extend(AddAppWorkflowController.prototype, {

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
          imageRegistry: null,
          projectId: null,
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
              onNext: function () {
                return that.validateNewRoute().then(function () {
                  return that.createApp().then(function () {
                    that.spaceModel.listAllServicesForSpace(
                      that.userInput.serviceInstance.guid,
                      that.userInput.space.metadata.guid
                    ).then(function (services) {
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
                              function (o) {
                                return {label: o, value: {categories: o}, lower: o.toLowerCase()};
                              });
                            categories = _.unionBy(categories, serviceCategories, 'lower');
                          }
                        }
                      });
                      categories = _.sortBy(categories, 'lower');
                      that.options.serviceCategories.length = 1;
                      [].push.apply(that.options.serviceCategories, categories);
                    });
                  });
                });
              }
            },
            {
              title: gettext('Services'),
              formName: 'application-services-form',
              templateUrl: path + 'services.html',
              nextBtnText: gettext('Next'),
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
          pipeline: [
            {
              ready: true,
              title: gettext('Select Source'),
              templateUrl: path + 'pipeline-subflow/select-source.html',
              formName: 'application-source-form',
              nextBtnText: gettext('Next'),
              onNext: function () {
                var oauth;
                if (that.userInput.source.vcs_type === 'GITHUB') {
                  oauth = that.githubOauthService.start();
                } else {
                  oauth = that.$q.defer();
                  oauth.resolve();
                  oauth = oauth.promise;
                }

                return oauth
                  .then(function () {
                    return that.getRepos();
                  });
              }
            },
            {
              ready: true,
              title: gettext('Select Repository'),
              templateUrl: path + 'pipeline-subflow/select-repository.html',
              formName: 'application-repo-form',
              nextBtnText: gettext('Next'),
              onNext: function () {
                that.getPipelineDetailsData();

                if (that.userInput.repo) {
                  that.hceModel.getProjects(that.userInput.hceCnsi.guid).then(function (projects) {
                    var usedBranches = _.chain(projects)
                      .filter(function (p) {
                        return p.repo.full_name === that.userInput.repo.full_name;
                      })
                      .map(function (p) {
                        return p.repo.branch;
                      })
                      .value();

                    return that.githubModel.branches(that.userInput.repo.full_name)
                      .then(function () {
                        var branches = _.map(that.githubModel.data.branches,
                          function (o) {
                            var used = _.indexOf(usedBranches, o.name) >= 0;
                            return {
                              disabled: used,
                              label: o.name + (used ? gettext(' (used by other project)') : ''),
                              value: o.name
                            };
                          });
                        [].push.apply(that.options.branches, branches);
                      });
                  });
                }
              }
            },
            {
              ready: true,
              title: gettext('Pipeline Details'),
              templateUrl: path + 'pipeline-subflow/pipeline-details.html',
              formName: 'application-pipeline-details-form',
              nextBtnText: gettext('Create pipeline'),
              onNext: function () {
                that.hceModel.getDeploymentTargets(that.userInput.hceCnsi.guid).then(function () {
                  var name = that._getDeploymentTargetName();
                  var target = _.find(that.hceModel.data.deploymentTargets, {name: name});
                  if (target) {
                    that.createPipeline(target.deployment_target_id)
                      .then(function (response) {
                        that.userInput.projectId = response.data.id;
                      });
                  } else {
                    that.createDeploymentTarget().then(function (newTarget) {
                      that.createPipeline(newTarget.deployment_target_id)
                        .then(function (response) {
                          that.userInput.projectId = response.data.id;
                        });
                    });
                  }
                });
              }
            },
            {
              ready: true,
              title: gettext('Notifications'),
              templateUrl: 'plugins/cloud-foundry/view/applications/application/' +
              'notification-targets/notification-target-list.html',
              formName: 'application-pipeline-notification-form',
              nextBtnText: gettext('Next'),
              onEnter: function () {
                return that.hceModel.listNotificationTargetTypes(that.userInput.hceCnsi.guid)
                  .then(function () {
                    that.options.notificationTargetTypes = that.hceModel.data.notificationTargetTypes;
                  });
              }
            },
            {
              ready: true,
              title: gettext('Deploy App'),
              templateUrl: path + 'pipeline-subflow/deploy.html',
              formName: 'application-pipeline-deploy-form',
              nextBtnText: gettext('Finished code change'),
              isLastStep: true
            }
          ],
          cli: [
            {
              ready: true,
              title: gettext('Deploy App'),
              templateUrl: path + 'cli-subflow/deploy.html',
              formName: 'application-cli-deploy-form',
              nextBtnText: gettext('Finished'),
              isLastStep: true
            }
          ]
        };

        this.options = {
          workflow: that.data.workflow,
          userInput: this.userInput,
          eventService: this.eventService,
          errors: this.errors,
          subflow: null,
          serviceInstances: [],
          services: [],
          serviceCategories: [
            {label: gettext('All Services'), value: 'all'}
          ],
          organizations: [],
          spaces: [],
          apps: [],
          domains: [],
          hceCnsis: [],
          notificationTargetTypes: [],
          notificationTargets: [],
          sources: [],
          displayedRepos: [],
          repos: [],
          hasMoreRepos: false,
          loadingRepos: false,
          branches: [],
          buildContainers: [],
          imageRegistries: [],
          notificationFormAppMode: true
        };

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
       * @function validateNewRoute
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description check a route exists
       * @returns {promise} A resolved/rejected promise
       */
      validateNewRoute: function () {
        var that = this;
        return this.$q(function (resolve, reject) {
          that.routeModel.checkRouteExists(
            that.userInput.serviceInstance.guid,
            that.userInput.domain.metadata.guid,
            that.userInput.host
          )
            .then(function (data) {
              if (data && data.code === 10000) {
                that.errors.invalidRoute = false;
                resolve();
              } else {
                that.errors.invalidRoute = true;
                reject();
              }
            });
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
        return this.organizationModel.listAllOrganizations(cnsiGuid)
          .then(function (organizations) {
            that.options.organizations.length = 0;
            [].push.apply(that.options.organizations, _.map(organizations, that.selectOptionMapping));
            that.userInput.organization = that.options.organizations[0].value;
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
        return this.organizationModel.listAllSpacesForOrganization(cnsiGuid, guid)
          .then(function (spaces) {
            that.options.spaces.length = 0;
            [].push.apply(that.options.spaces, _.map(spaces, that.selectOptionMapping));
            that.userInput.space = that.options.spaces[0].value;
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
       * @function selectOptionMapping
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description domain mapping function
       * @param {object} o - an object to map
       * @returns {object} select-option object
       */
      selectOptionMapping: function (o) {
        return {
          label: o.entity.name,
          value: o
        };
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

      getHceInstances: function () {
        var that = this;
        this.cnsiModel.list().then(function () {
          that.options.hceCnsis.length = 0;
          var hceCnsis = _.filter(that.cnsiModel.serviceInstances, {cnsi_type: 'hce'}) || [];
          if (hceCnsis.length > 0) {
            var hceOptions = _.map(hceCnsis, function (o) {
              return {label: o.api_endpoint.Host, value: o};
            });
            [].push.apply(that.options.hceCnsis, hceOptions);
            that.userInput.hceCnsi = hceOptions[0].value;
          } else {
            that.redefineWorkflowWithoutHce();
          }
        });
      },

      getVcsInstances: function () {
        var that = this;
        var vcsTypesPromise = that.hceModel.listVcsTypes(that.userInput.hceCnsi.guid);
        var vcsInstancesPromise = that.hceModel.getVcses(that.userInput.hceCnsi.guid);
        return that.$q.all([vcsTypesPromise, vcsInstancesPromise])
          .then(function () {
            var sources = _.map(that.hceModel.data.vcsInstances, function (o) {
              var vcsType = that.hceModel.data.vcsTypes[o.vcs_type];
              return {
                img: vcsType.icon_url,
                label: vcsType.vcs_type_label,
                description: vcsType.description,
                value: o
              };
            }) || [];
            if (sources.length > 0) {
              [].push.apply(that.options.sources, sources);
              that.userInput.source = sources[0].value;
            }
          });
      },

      getRepos: function () {
        var that = this;
        this.options.loadingRepos = true;
        return this.githubModel.repos()
          .then(function (response) {
            that.options.hasMoreRepos = angular.isDefined(response.links.next);
            [].push.apply(that.options.repos, response.repos);
          })
          .finally(function () {
            that.options.loadingRepos = false;
          });
      },

      loadMoreRepos: function () {
        var that = this;
        this.options.loadingRepos = true;
        return this.githubModel.nextRepos()
          .then(function (response) {
            that.options.hasMoreRepos = angular.isDefined(response.links.next);
            [].push.apply(that.options.repos, response.newRepos);
          })
          .finally(function () {
            that.options.loadingRepos = false;
          });
      },

      filterRepos: function (newFilterTerm) {
        var that = this;
        this.options.loadingRepos = true;
        return this.$q.when(this.githubModel.filterRepos(newFilterTerm))
          .then(function (response) {
            if (angular.isDefined(response)) {
              that.options.hasMoreRepos = angular.isDefined(response.links.next);
              [].push.apply(that.options.repos, response.newRepos);
            }
          }).finally(function () {
            that.options.loadingRepos = false;
          });
      },

      getPipelineDetailsData: function () {
        var that = this;

        this.hceModel.getBuildContainers(this.userInput.hceCnsi.guid)
          .then(function () {
            var buildContainers = _.map(that.hceModel.data.buildContainers,
              function (o) {
                return {label: o.build_container_label, value: o};
              });
            [].push.apply(that.options.buildContainers, buildContainers);
          });

        this.hceModel.getImageRegistries(this.userInput.hceCnsi.guid)
          .then(function () {
            var imageRegistries = _.map(that.hceModel.data.imageRegistries,
              function (o) {
                return {label: o.registry_label, value: o};
              });
            [].push.apply(that.options.imageRegistries, imageRegistries);
          });
      },

      /**
       * @function appendSubflow
       * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
       * @description append a sub workflow to the main workflow
       * @param {object} subflow - the sub workflow to append
       */
      appendSubflow: function (subflow) {
        this.data.workflow.steps.length = this.data.countMainWorkflowSteps;
        [].push.apply(this.data.workflow.steps, subflow);
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
        return this.$q(function (resolve, reject) {
          that.appModel.createApp(cnsiGuid, {
            name: that.userInput.name,
            space_guid: that.userInput.space.metadata.guid
          }).then(function (response) {
            var deferred = that.$q.defer();
            var app = response[cnsiGuid];
            var summaryPromise = that.appModel.getAppSummary(cnsiGuid, app.metadata.guid);

            // Add route
            var routeSpec = {
              host: that.userInput.host,
              domain_guid: that.userInput.domain.metadata.guid,
              space_guid: that.userInput.space.metadata.guid
            };

            var routePromise = that.routeModel.createRoute(cnsiGuid, routeSpec)
              .then(function (route) {
                that.routeModel
                  .associateAppWithRoute(cnsiGuid, route.metadata.guid, app.metadata.guid)
                  .then(resolve, reject);
              });

            var promises = [summaryPromise, routePromise];
            that.$q.all(promises).then(function () {
              that.userInput.application = that.appModel.application;
            }, deferred.reject);

            return deferred.promise;
          });
        });
      },

      createDeploymentTarget: function () {
        var name = this._getDeploymentTargetName();
        var endpoint = this.userInput.serviceInstance.api_endpoint;
        var url = endpoint.Scheme + '://' + endpoint.Host;
        return this.hceModel.createDeploymentTarget(this.userInput.hceCnsi.guid,
          name,
          url,
          this.userInput.clusterUsername,
          this.userInput.clusterPassword,
          this.userInput.organization.entity.name,
          this.userInput.space.entity.name);
      },

      _getDeploymentTargetName: function () {
        return [
          this.userInput.serviceInstance.name,
          this.userInput.organization.entity.name,
          this.userInput.space.entity.name
        ].join('_');
      },

      createPipeline: function (targetId) {
        return this.hceModel.createProject(this.userInput.hceCnsi.guid,
          this.userInput.name,
          this.userInput.source,
          targetId,
          this.userInput.buildContainer.build_container_id,
          this.userInput.repo,
          this.userInput.branch);
      },

      triggerPipeline: function () {
        var that = this;
        this.githubModel.getBranch(this.userInput.repo.full_name, this.userInput.branch)
          .then(function (response) {
            var branch = response.data;
            that.hceModel.triggerPipelineExecution(that.userInput.hceCnsi.guid,
              that.userInput.projectId,
              branch.commit.sha);
          });
      },

      startWorkflow: function () {
        var that = this;
        this.addingApplication = true;
        this.reset();
        this.appModel.all();
        this.getHceInstances();
        this.serviceInstanceModel.list()
          .then(function (serviceInstances) {
            var validServiceInstances = _.chain(_.values(serviceInstances))
              .filter({cnsi_type: 'hcf', valid: true})
              .map(function (o) {
                return {label: o.api_endpoint.Host, value: o};
              })
              .value();
            [].push.apply(that.options.serviceInstances, validServiceInstances);
          });
      },

      stopWorkflow: function () {
        this.addingApplication = false;
      },

      finishWorkflow: function () {
        if (this.options.subflow === 'pipeline') {
          this.triggerPipeline();
        }
        this.addingApplication = false;
      }
    });
  }

})();
