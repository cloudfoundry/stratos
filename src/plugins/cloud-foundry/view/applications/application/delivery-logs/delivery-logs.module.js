(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-logs', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.delivery-logs', {
      url: '/delivery-logs',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/delivery-logs.html',
      controller: ApplicationDeliveryLogsController,
      controllerAs: 'appDelLogsCtrl'
    });
  }

  ApplicationDeliveryLogsController.$inject = [
    '$scope',
    '$stateParams',
    '$interval',
    '$q',
    'moment',
    'app.model.modelManager',
    'helion.framework.widgets.detailView'
  ];

  /**
   * @name ApplicationDeliveryLogsController
   * @constructor
   * @param {object} $scope - the controller's $scope
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $interval - the angular $interval service
   * @param {object} $q - the angular $q service
   * @param {object} moment - the moment timezone component
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.detailView} detailView - the helion framework detailView widget
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryLogsController($scope, $stateParams, $interval, $q, moment, modelManager, detailView) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.last = {
      build: null,
      test: null,
      deploy: null
    };

    var that = this;
    var updateModelPromise;

    /* eslint-disable */
    // TODO: Fetch the actual user.
    // TODO: Check if project id already exists in hce model?
    /* eslint-enable */
    that.hceModel.getUserByGithubId('18697775')
      .then(function() {
        return that.hceModel.getProjects();
      })
      .then(function() {
        that.model.application.summary.name = 'test';// Temp override
        return that.hceModel.getProject(that.model.application.summary.name);
      })
      .then(function(project) {
        if (angular.isUndefined(project)) {
          throw 'Could not find project with name \'' + that.model.application.summary.name + '\'';
        } else {
          updateData();
          //updateModelPromise = $interval(updateData, 30 * 1000, 0, true);
        }
      })
      .catch(function(error) {
        console.error('Failed to fetch delivery logs data: ', error);
      });

    function updateData() {
      var project = that.hceModel.getProject(that.model.application.summary.name);
      return that.hceModel.getPipelineExecutions(project.id)
        .then(function () {

          // Need to optimise for projects with a large amount of executions/builds
          // - only process visible executions
          // - Don't fetch events for all executions

          that.eventsPerExecution = {};
          // The ux will need to show the translated & localise date/time in the table. In order for the search filter
          // for the table to work this conversion needs to happen before being pushed to scope. So two options,
          // either append these values to to existing hceModel.data object or clone and update as needed for this
          // specific directive
          addMockData();
          that.parsedHceModel = JSON.parse(JSON.stringify(that.hceModel.data));

          var fetchEventsPromises = [];
          var lastBuildTime, lastTestTime, lastDeployTime;

          for (var i = 0; i < that.parsedHceModel.pipelineExecutions.length; i++) {
            var execution = that.parsedHceModel.pipelineExecutions[i];

            // Something weird about this part
            var thisExecutionTime = moment(execution.reason.createdDate);
            if (execution.result === 'Success') {
              if (angular.isUndefined(lastDeployTime) || lastDeployTime.diff(thisExecutionTime) < 0) {
                lastBuildTime = thisExecutionTime;
                lastTestTime = thisExecutionTime;
                lastDeployTime = thisExecutionTime;
                that.last.build = execution;
                that.last.test = execution;
                that.last.deploy = execution;
              }
            } else if (!lastDeployTime && execution.result === 'Deploying') {
              // If Deploying, must have passed testing
              if (angular.isUndefined(lastTestTime) || lastTestTime.diff(thisExecutionTime) < 0) {
                lastBuildTime = thisExecutionTime;
                lastTestTime = thisExecutionTime;
                that.last.build = execution;
                that.last.test = execution;
              }
            } else if (!lastTestTime && execution.result === 'Testing') {
              // If Testing, must have passed building
              if (angular.isUndefined(lastBuildTime) || lastBuildTime.diff(thisExecutionTime) < 0) {
                lastBuildTime = thisExecutionTime;
                that.last.build = execution;
              }
            }

            updateExecutionForFiltering(that.parsedHceModel.pipelineExecutions, execution, i);

            fetchEventsPromises.push(fetchEvents(that.eventsPerExecution, execution.id));

          }
          return $q.all(fetchEventsPromises);
        })
        .catch(function (error) {
          console.error('Failed to fetch/process pipeline executions or events: ', error);
        });
    }

    function fetchEvents(eventsPerExecution, executionId) {
      return that.hceModel.getPipelineEvents(executionId)
        .then(function(events) {
          if (eventsPerExecution[executionId]) {
            // TODO: REMOVE
            return;
          }
          eventsPerExecution[executionId] = events;
        });
    }

    function updateExecutionForFiltering(executions, execution, pos) {
      // Localise the reason creation date string (use i18n date/time format)
      execution.reason.createdDateString = moment(execution.reason.createdDate).format('L - LTS');

      // Update the result with translated text
      execution.result = {
        value: execution.result,
        label: gettext(execution.result)
      };

      // Strip out properties that aren't displayed (filtering by values which aren't shown is a bit jarring)
      var propertiesToKeep = ['id', 'message', 'result', 'reason.createdDateString', 'reason.author', 'reason.type'];
      var cleanExeuction = {};
      for (var j = 0; j < propertiesToKeep.length; j++) {
        var toKeep = propertiesToKeep[j];
        _.set(cleanExeuction, toKeep, _.get(execution, toKeep));
      }
      executions[pos] = cleanExeuction;
    }

    function addMockData() {
      var mocked = [
        {
          concoursePipelineId: "1362eeb20-219f-11e6-8838-71fe4dbc2489",
          id: 91,
          message: "Update lastupdated.txt",
          name: "Commit number 2",
          reason: {
            author: "DBaldwin",
            avatarUrl: "https://avatars.githubusercontent.com/u/18697775?v=3",
            commitSha: "123d97f1fc9189c9a9fcc66978e3c85af856262fe",
            commitUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            compareUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            createdDate: moment().subtract(46, 'seconds').valueOf(),
            pullRequestId: null,
            type: "manual"
          },
          result: "Failure"
        },
        {
          concoursePipelineId: "2362eeb20-219f-11e6-8838-71fe4dbc2489",
          id: 92,
          message: "Update lastupdated.txt",
          name: "Commit number 2",
          reason: {
            author: "DBaldwin",
            avatarUrl: "https://avatars.githubusercontent.com/u/18697775?v=3",
            commitSha: "123d97f1fc9189c9a9fcc66978e3c85af856262fe",
            commitUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            compareUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            createdDate: moment().subtract(460, 'seconds').valueOf(),
            pullRequestId: null,
            type: "manual"
          },
          result: "Success"
        },
        {
          concoursePipelineId: "3362eeb20-219f-11e6-8838-71fe4dbc2489",
          id: 93,
          message: "Fixed the log in so logs go in",
          name: "Change to log in",
          reason: {
            author: "JAubrey",
            avatarUrl: "https://avatars.githubusercontent.com/u/18697775?v=3",
            commitSha: "423d97aasdasfffcc66978e3c85af856262fe",
            commitUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            compareUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            createdDate: moment().subtract(4606, 'seconds').valueOf(),
            pullRequestId: null,
            type: "manual"
          },
          result: "Deploying"
        },
        {
          concoursePipelineId: "4362eeb20-219f-11e6-8838-71fe4dbc2489",
          id: 94,
          message: "Fixed broken broker",
          name: "Fixed broken broker",
          reason: {
            author: "GNuman",
            avatarUrl: "https://avatars.githubusercontent.com/u/18697775?v=3",
            commitSha: "523d97f1fc9189c9a9fcc66978e3c85af856262fe",
            commitUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            compareUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            createdDate: moment().subtract(50064, 'seconds').valueOf(),
            pullRequestId: null,
            type: "manual"
          },
          result: "Success"
        },
        {
          concoursePipelineId: "5362eeb20-219f-11e6-8838-71fe4dbc2489",
          id: 95,
          message: "Break the build",
          name: "Break the build",
          reason: {
            author: "BAtman",
            avatarUrl: "https://avatars.githubusercontent.com/u/18697775?v=3",
            commitSha: "623d97f1fc9189c9a9fcc66978e3c85af856262fe",
            commitUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            compareUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            createdDate: moment().subtract(55064, 'seconds').valueOf(),
            pullRequestId: null,
            type: "because why not"
          },
          result: "unknown"
        },
        {
          concoursePipelineId: "6362eeb20-219f-11e6-8838-71fe4dbc2489",
          id: 96,
          message: "Break the build",
          name: "Break the build",
          reason: {
            author: "BAtman",
            avatarUrl: "https://avatars.githubusercontent.com/u/18697775?v=3",
            commitSha: "623d97f1fc9189c9a9fcc66978e3c85af856262fe",
            commitUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            compareUrl: "https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe",
            createdDate: moment().subtract(60064, 'seconds').valueOf(),
            pullRequestId: null,
            type: "manual"
          },
          result: "Failure"
        }
      ];
      that.hceModel.data.pipelineExecutions = that.hceModel.data.pipelineExecutions.concat(mocked);

      that.eventsPerExecution['91'] = [
        createEvent(90, "build", "Failure", 46, 40, 91)
      ];
      that.eventsPerExecution['92'] = [
        createEvent(91, "build", "Success", 500, 510, 92),
        createEvent(92, "test", "Success", 600, 650, 92),
        createEvent(93, "deploy", "Success", 650, 40, 92)
      ];
      that.eventsPerExecution['93'] = [
        createEvent(94, "build", "Success", 4606, 4600, 93),
        createEvent(95, "test", "Success", 4600, 4560, 93),
        createEvent(96, "deploy", "Deploying", 4560, 4510, 93)
      ];
      that.eventsPerExecution['94'] = [
        createEvent(97, "build", "Success", 50064, 50060, 94),
        createEvent(98, "test", "Success", 50055, 50050, 94),
        createEvent(99, "deploy", "Success", 50050, 50045, 94)
      ];
      that.eventsPerExecution['95'] = [
      ];
      that.eventsPerExecution['96'] = [
        createEvent(91, "build", "Success", 60064, 60060, 96),
        createEvent(92, "test", "Failure", 60060, 60000, 96)
      ];

      function createEvent(id, type, state, startOffset, endOffset, execId) {
        return {
          "id": id,
          "name": "string",
          "type": type,
          "state": state,
          "startDate": moment().subtract(startOffset, 'seconds'),
          "endDate": moment().subtract(endOffset, 'seconds'),
          "execution_id": execId,
          "artifact_id": 0
        }
      }
    }

    $scope.$on("$destroy", function() {
      if (updateModelPromise) {
        $interval.cancel(updateModelPromise);
      }
    });

    this.id = $stateParams.guid;
    this.detailView = detailView;
  }

  angular.extend(ApplicationDeliveryLogsController.prototype, {

    triggerBuild: function() {
      /* eslint-disable */
      alert('TODO: trigger build');
      /* eslint-enable */
    },

    viewSummaryItem: function(item) {
      /* eslint-disable */
      alert('TODO: Show.. ' + item.link);
      /* eslint-enable */
    },

    viewExecution: function (execution) {
      var that = this;
      var rawExecution = _.find(that.hceModel.data.pipelineExecutions, function (o) {
        return o.id === execution.id;
      });

      this.detailView({
        templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/details/execution.html',
        title: rawExecution.message
      }, {
        execution: rawExecution,
        events: that.eventsPerExecution[execution.id],
        viewEvent: function (build) {
          that.viewEvent(build);
        }
      });
    },

    viewEventForExecution: function (execution) {
      var events = this.eventsPerExecution[execution.id];
      var latestEvent;
      var lastEventTime;
      _.forEach(events, function(event) {
        if (!lastEventTime || lastEventTime.diff(event.endDate) < 0) {
          lastEventTime = moment(event.endDate);
          latestEvent = event;
        }
      });

      if (!latestEvent) {
        return;
      }
      this.viewEvent(latestEvent);
    },

    viewEvent: function(event) {
      this.detailView({
        templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/details/event.html',
        title: gettext('Build Log')
      }, {
        event: event
      });
    }
  });

})();
