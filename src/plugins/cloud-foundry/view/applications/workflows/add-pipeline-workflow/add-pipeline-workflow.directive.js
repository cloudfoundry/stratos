(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addPipelineWorkflow', addPipelineWorkflow);

  addPipelineWorkflow.$inject = [];

  /**
   * @memberof cloud-foundry.view.applications
   * @name addAppWorkflow
   * @description An add-app-workflow directive
   * @returns {object} The add-app-workflow directive definition object
   */
  function addPipelineWorkflow() {
    return {
      controller: AddPipelineWorkflowController,
      controllerAs: 'addPipelineWorkflowCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/add-pipeline-workflow.html'
    };
  }

  AddPipelineWorkflowController.$inject = [
    'app.model.modelManager',
    'app.event.eventService',
    'github.view.githubOauthService',
    '$scope',
    '$q'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the Event management service
   * @param {object} githubOauthService - github oauth service
   * @param {object} $scope - angular $scope
   * @param {object} $q - angular $q service
   * @property {object} $scope - angular $scope
   * @property {object} $q - angular $q service
   * @property {object} appModel - the Cloud Foundry applications model
   * @property {object} githubModel - the Github model
   * @property {object} data - a data bag
   * @property {object} userInput - user's input about new application
   */
  function AddPipelineWorkflowController(modelManager, eventService, githubOauthService, $scope, $q) {
    this.$scope = $scope;
    this.$q = $q;
    this.addingPipeline = false;
    this.eventService = eventService;
    this.githubOauthService = githubOauthService;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.githubModel = modelManager.retrieve('cloud-foundry.model.github');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');

    this.userInput = {};
    this.options = {};

    var that = this;
    this.eventService.$on('cf.events.START_ADD_PIPELINE_WORKFLOW', function () {
      that.startWorkflow();
    });
  }

  angular.extend(AddPipelineWorkflowController.prototype, {
    reset: function () {
      var that = this;

      var path = 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/';
      this.data = {};
      this.errors = {};

      this.userInput = {
        application: null,
        hceCnsi: null,
        source: null,
        repo: null,
        branch: null,
        buildContainer: null,
        imageRegistry: null,
        projectId: null
      };

      this.data.workflow = {
        allowJump: false,
        allowBack: false,
        title: gettext('Add Pipeline'),
        steps: [
          {
            ready: true,
            title: gettext('Select Endpoint'),
            templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/select-endpoint.html',
            formName: 'application-endpoint-form',
            onNext: function () {
              return that.getVcsInstances();
            }
          },
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
                  return that.githubModel.repos();
                })
                .then(function () {
                  var repos = _.filter(that.githubModel.data.repos || [], function (o) { return o.permissions.admin; });
                  [].push.apply(that.options.repos, repos);
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
                                      .map(function (p) { return p.repo.branch; })
                                      .value();

                  return that.githubModel.branches(that.userInput.repo.full_name)
                    .then(function () {
                      var branches = _.map(that.githubModel.data.branches,
                                          function (o) {
                                            return {
                                              label: o.name + (_.indexOf(usedBranches, o.name) >= 0 ? gettext(' (used by other project)') : ''),
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
            templateUrl: path + 'pipeline-subflow/notifications.html',
            formName: 'application-pipeline-notification-form',
            nextBtnText: gettext('Skip')
          },
          {
            ready: true,
            title: gettext('Deploy App'),
            templateUrl: path + 'pipeline-subflow/deploy.html',
            formName: 'application-pipeline-deploy-form',
            nextBtnText: gettext('Finished code change'),
            isLastStep: true
          }
        ]
      };

      this.options = {
        workflow: that.data.workflow,
        userInput: this.userInput,
        errors: this.errors,
        apps: [],
        hceCnsis: [],
        notificationTargets: [
          {
            title: 'HipChat',
            description: gettext('Connect a HipChat instance to receive pipeline events (build, test, deploy) in a  Hipchat room.'),
            img: 'hipchat_logo.png'
          },
          {
            title: 'Http',
            description: gettext('Specify an endpoint where pipeline events should be sent (e.g. URL of an internal website, a communication tool, or an RSS feed).'),
            img: 'httppost_logo.png'
          },
          {
            title: 'Flow Dock',
            description: gettext('Connect a Flowdock instance to receive pipeline events (build, test, deploy) in a specific Flow.'),
            img: 'flowdock_logo.png'
          }
        ],
        sources: [],
        repos: [],
        branches: [],
        buildContainers: [],
        imageRegistries: []
      };

      this.addPipelineActions = {
        stop: function () {
          that.stopWorkflow();
        },

        finish: function () {
          that.finishWorkflow();
        }
      };
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

    getHceInstances: function () {
      var that = this;
      this.cnsiModel.list().then(function () {
        that.options.hceCnsis.length = 0;
        var hceCnsis = _.filter(that.cnsiModel.serviceInstances, { cnsi_type: 'hce' }) || [];
        if (hceCnsis.length > 0) {
          var hceOptions = _.map(hceCnsis, function (o) { return { label: o.api_endpoint.Host, value: o }; });
          [].push.apply(that.options.hceCnsis, hceOptions);
          that.userInput.hceCnsi = hceOptions[0].value;
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

    getPipelineDetailsData: function () {
      var that = this;

      this.hceModel.getBuildContainers(this.userInput.hceCnsi.guid)
        .then(function () {
          var buildContainers = _.map(that.hceModel.data.buildContainers,
                                      function (o) { return { label: o.build_container_label, value: o }; });
          [].push.apply(that.options.buildContainers, buildContainers);
        });

      this.hceModel.getImageRegistries(this.userInput.hceCnsi.guid)
        .then(function () {
          var imageRegistries = _.map(that.hceModel.data.imageRegistries,
                                      function (o) { return { label: o.registry_label, value: o }; });
          [].push.apply(that.options.imageRegistries, imageRegistries);
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
      this.addingPipeline = true;
      this.reset();
      this.getHceInstances();
    },

    stopWorkflow: function () {
      this.addingPipeline = false;
    },

    finishWorkflow: function () {
      this.triggerPipeline();
      this.addingPipeline = false;
    }
  });

})();
