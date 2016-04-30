(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addAppWorkflow', addAppWorkflow);

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
    'app.event.eventService'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the Event management service
   * @property {object} model - the Cloud Foundry applications model
   * @property {object} serviceInstanceModel - the application service instance model
   * @property {object} githubModel - the Github model
   * @property {object} data - a data bag
   * @property {object} userInput - user's input about new application
   */
  function AddAppWorkflowController(modelManager, eventService) {
    var that = this;

    this.addingApplication = false;
    this.eventService = eventService;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.githubModel = modelManager.retrieve('cloud-foundry.model.github');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.eventService.$on('cf.events.START_ADD_APP_WORKFLOW', function () {
      that.startWorkflow();
    });
  }

  angular.extend(AddAppWorkflowController.prototype, {

    reset: function () {
      var that = this;

      var path = 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/';
      this.data = {};

      this.userInput = {
        name: null,
        serviceInstance: null,
        domain: null,
        source: 'github',
        repo: null,
        branch: null,
        buildContainer: null,
        imageRegistry: null
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
            form: 'application-name-form',
            nextBtnText: gettext('Create and continue'),
            onNext: function () {
            }
          },
          {
            title: gettext('Services'),
            templateUrl: path + 'services.html',
            nextBtnText: gettext('Next')
          },
          {
            title: gettext('Delivery'),
            templateUrl: path + 'delivery.html',
            nextBtnText: gettext('Next'),
            onNext: function () {
              that.appendSubflow(that.data.subflows[that.options.subflow]);
            }
          }
        ]
      };

      this.data.subflows = {
        pipeline: [
          {
            ready: true,
            title: gettext('Select Source'),
            templateUrl: path + 'pipeline-subflow/select-source.html',
            nextBtnText: gettext('Next'),
            onNext: function () {
              return that.githubModel.repos()
                .then(function () {
                  var repos = _.filter(that.githubModel.data.repos,
                                       function (o) { return o.permissions.admin; });
                  [].push.apply(that.options.repos, repos);
                });
            }
          },
          {
            ready: true,
            title: gettext('Select Repository'),
            templateUrl: path + 'pipeline-subflow/select-repository.html',
            nextBtnText: gettext('Next'),
            onNext: function () {
              that.hceModel.getBuildContainers()
                .then(function () {
                  var buildContainers = _.map(that.hceModel.data.buildContainers,
                                              function (o) { return { label: o.build_container_label, value: o }; });
                  [].push.apply(that.options.buildContainers, buildContainers);
                });

              that.hceModel.getImageRegistries()
                .then(function () {
                  var imageRegistries = _.map(that.hceModel.data.imageRegistries,
                                              function (o) { return { label: o.registry_label, value: o }; });
                  [].push.apply(that.options.imageRegistries, imageRegistries);
                });

              if (that.userInput.repo) {
                return that.githubModel.branches(that.userInput.repo.full_name)
                  .then(function () {
                    var branches = _.map(that.githubModel.data.branches,
                                         function (o) { return { label: o.name, value: o }; });
                    [].push.apply(that.options.branches, branches);
                  });
              }
            }
          },
          {
            ready: true,
            title: gettext('Pipeline Details'),
            templateUrl: path + 'pipeline-subflow/pipeline-details.html',
            nextBtnText: gettext('Create pipeline'),
            onNext: function () {
            }
          },
          {
            ready: true,
            title: gettext('Notifications'),
            templateUrl: path + 'pipeline-subflow/notifications.html',
            nextBtnText: gettext('Skip')
          },
          {
            ready: true,
            title: gettext('Deploy'),
            templateUrl: path + 'pipeline-subflow/deploy.html',
            nextBtnText: gettext('Finished with code change'),
            isLastStep: true
          }
        ],
        cli: [
          {
            ready: true,
            title: gettext('Deploy'),
            templateUrl: path + 'cli-subflow/deploy.html',
            nextBtnText: gettext('Finished with code change'),
            isLastStep: true
          }
        ]
      };

      this.serviceInstanceModel.list()
        .then(function (serviceInstances) {
          var validServiceInstances = _.chain(serviceInstances)
                                       .filter('valid')
                                       .map(function (o) {
                                         return { label: o.url, value: o };
                                       })
                                       .value();
          [].push.apply(that.options.serviceInstances, validServiceInstances);
        });

      this.options = {
        workflow: that.data.workflow,
        userInput: this.userInput,
        subflow: 'pipeline',

        // mock data
        serviceInstances: [],
        domains: [
          { label: 'domain-28.example.com', value: 'domain-28.example.com'},
          { label: 'customer-app-domain1.com', value: 'customer-app-domain1.com'},
          { label: 'customer-app-domain2.com', value: 'customer-app-domain2.com'},
          { label: 'domain-38.example.com', value: 'domain-38.example.com'},
          { label: 'domain-39.example.com', value: 'domain-39.example.com'},
          { label: 'domain-40.example.com', value: 'domain-40.example.com'},
          { label: 'domain-41.example.com', value: 'domain-41.example.com'}
        ],
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
        sources: [
          {
            img: 'github_octocat.png',
            label: 'Github',
            description: gettext('Connect to a repository hosted on GitHub.com that you own or have admin rights to.'),
            value: 'github'
          },
          {
            img: 'GitHub-Mark-120px-plus.png',
            label: 'Github Enterprise',
            description: gettext('Connect to a repository hosted on an on-premise Github Enterprise instance that you own or have admin rights to.'),
            value: 'github-enterprise'
          },
          {
            img: 'git.png',
            label: 'Git',
            description: gettext('Connect to a repository hosted locally. You will need to provide the name of the repo and the clone URL.'),
            value: 'git'
          }
        ],
        repos: [],
        branches: [],
        buildContainers: [],
        imageRegistries: []
      };

      this.addApplicationActions = {
        stop: function () {
          that.stopWorkflow();
        },

        finish: function () {
          that.finishWorkflow();
        }
      };

      this.userInput.domain = this.options.domains[0].value;
    },

    /**
     * @function appendSubflow
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description append a sub workflow to the main workflow
     * @param {object} subflow - the sub workflow to append
     */
    appendSubflow: function (subflow) {
      [].push.apply(this.data.workflow.steps, subflow);
    },

    /**
     * @function createApp
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description create an application
     */
    createApp: function () {
    },

    startWorkflow: function () {
      this.addingApplication = true;
      this.reset();
    },

    stopWorkflow: function () {
      this.addingApplication = false;
    },

    finishWorkflow: function () {
      this.addingApplication = false;
    }

  });

})();
