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
    '$log',
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
   * @param {object} $log - the angular $log service
   * @param {object} moment - the moment timezone component
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.detailView} detailView - the helion framework detailView widget
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {object} hceModel - the Code Engine Applications Model
   * @property {string} hasProject - true if a HCE project exists for this application
   * @property {object} last - contains the last successful build, test and deploy events
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryLogsController($scope, $stateParams, $interval, $q, $log, moment, modelManager, detailView) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.hasProject = null;
    this.last = {
      build: null,
      test: null,
      deploy: null
    };
    this.executionSearchTerms = ['message', 'result.label', 'reason.createdDateString', 'reason.author', 'reason.type'];
    this.id = $stateParams.guid;
    // Pass through anything needed by prototype extend
    this.detailView = detailView;
    this.$q = $q;
    this.moment = moment;
    this.$log = $log;

    var that = this;
    var updateModelPromise, promise;

    /* eslint-disable */
    // TODO (rcox): Both vars + anything associated with to be removed once everything is wired in
    /* eslint-enable */
    this.addMock = true;
    this.haveBackend = false;

    if (this.haveBackend) {
      /* eslint-disable */
      // TODO (kdomico): Hi! I've used the same github user approach. Update here as well or let me know if I need to do it
      // TODO (rcox): Improvements - Check if project id already exists in hce model?
      /* eslint-enable */
      promise = that.hceModel.getUserByGithubId('18697775')
        .then(function() {
          return that.hceModel.getProjects();
        })
        .then(function() {
          //that.model.application.summary.name = 'test';// Temp override
          return that.hceModel.getProject(that.model.application.summary.name);
        });
    } else {
      promise = $q.when({});
    }

    promise
      .then(function (project) {
        that.hasProject = !(angular.isUndefined(project) || project === null);
        if (that.hasProject) {
          that.updateData();
          updateModelPromise = $interval(_.bind(that.updateData, that), 30 * 1000, 0, true);
        }
      })
      .catch(function (error) {
        $log.error('Failed to fetch project or process delivery logs data: ', error);
        that.hasProject = 'error';
      });

    $scope.$on("$destroy", function () {
      if (updateModelPromise) {
        $interval.cancel(updateModelPromise);
      }
    });

  }

  angular.extend(ApplicationDeliveryLogsController.prototype, {

    triggerBuild: function() {
      /* eslint-disable */
      alert('TODO: trigger build');
      /* eslint-enable */
    },

    viewExecution: function(execution) {
      var that = this;
      var rawExecution = _.find(that.hceModel.data.pipelineExecutions, function(o) {
        return o.id === execution.id;
      });

      this.detailView({
        templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/details/execution.html',
        title: rawExecution.message
      }, {
        execution: rawExecution,
        events: that.eventsPerExecution[execution.id],
        viewEvent: function(build) {
          that.viewEvent(build);
        }
      });
    },

    viewEventForExecution: function(execution) {
      var events = this.eventsPerExecution[execution.id];

      if (!events || events.length === 0) {
        return;
      }

      this.viewEvent(events.length - 1);
    },

    viewEvent: function(event) {
      this.detailView({
        templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/details/event.html',
        controller: 'eventDetailViewController',
        title: event.type
      }, {
        event: event
      });
    },

    /**
     * @name ApplicationDeliveryLogsController.updateData
     * @description Fetch all execution and event data. Parse the output
     */
    updateData: function() {
      /* eslint-disable */
      // TODO (rcox): Need to optimise for projects with large amount of executions/builds
      // - only process visible executions
      // - Don't fetch events for all executions
      // - See TEAMFOUR-375
      /* eslint-enable */
      var that = this;

      var promise;
      if (this.haveBackend) {
        var project = this.hceModel.getProject(this.model.application.summary.name);
        // Fetch pipeline executions
        promise = this.hceModel.getPipelineExecutions(project.id);
      } else {
        that.hceModel.data.pipelineExecutions = [];
        promise = this.$q.when();
      }
      if (this.addMock) {
        promise.then(function() {
          that.hceModel.data.pipelineExecutions = that.hceModel.data.pipelineExecutions.concat(that.createMockExecutions());
        });
      }

      promise
        .then(function() {
          // ParseFetch pipeline execution's events
          that.eventsPerExecution = {};

          var fetchEventsPromises = [];
          for (var i = 0; i < that.hceModel.data.pipelineExecutions.length; i++) {
            fetchEventsPromises.push(that.fetchEvents(that.eventsPerExecution, that.hceModel.data.pipelineExecutions[i].id));
          }
          return that.$q.all(fetchEventsPromises);
        })
        .then(function() {
          // The ux will need to show the translated & localise date/time in the table. In order for the search filter
          // for the table to work this conversion needs to happen before being pushed to scope. So two options,
          // either append these values to the existing hceModel.data object or clone and update as needed for this
          // specific directive
          /* eslint-disable */
          that.parsedHceModel = JSON.parse(JSON.stringify(that.hceModel.data));
          /* eslint-enable */

          for (var i = 0; i < that.parsedHceModel.pipelineExecutions.length; i++) {
            var execution = that.parsedHceModel.pipelineExecutions[i];
            that.parseExecution(execution, that.eventsPerExecution[execution.id]);
          }
        })
        .catch(function(error) {
          that.$log.error('Failed to fetch/process pipeline executions or events: ', error);
        });
    },

    /**
     * @name ApplicationDeliveryLogsController.fetchEvents
     * @description For the given execution find all related events. Also sort events in time order and parse
     * @param {object} eventsPerExecution - execution id : events name:key object
     * @param {object} executionId - id of execution
     * @returns {object} promise to use for completion notification
     */
    fetchEvents: function(eventsPerExecution, executionId) {
      var that = this;
      // Reset the last successful build/test/deploy events
      this.last = {
        build: {
          mEndData: moment(0)
        },
        test: {
          mEndData: moment(0)
        },
        deploy: {
          mEndData: moment(0)
        }
      };

      var promise;
      if (this.haveBackend) {
        promise = this.hceModel.getPipelineEvents(executionId);
      } else if (this.addMock) {
        promise = this.$q.when(this.createMockEvents(executionId));
      } else {
        promise = this.$q.reject('No backend, no mock, therefor no events');
      }

      return promise
        .then(function(events) {
          for (var i = 0; i < events.length; i++) {
            that.parseEvent(events[i], that.last);
          }
          events = _.sortBy(events, function(event) {
            return event.mEndDate ? event.mEndDate.utc() : Number.MAX_VALUE;
          });
          eventsPerExecution[executionId] = events;
        });
    },

    /**
     * @name ApplicationDeliveryLogsController.parseEvent
     * @description Update the event with the required information for the ux. This includes upfront momentising of
     * dates, calculating duration if missing, localising dates and labels, discovering the latest build/test/deploy
     * events, etc
     * @param {object} event - event to parse
     * @param {object} lastEvents - collection of most recent events per type
     */
    parseEvent: function(event, lastEvents) {
      event.mStartDate = event.startDate ? moment(event.startDate) : undefined;
      event.mEndDate = event.endDate ? moment(event.endDate) : undefined;

      if (!event.duration && (event.startDate && event.endDate)) {
        event.duration = moment(event.startDate).diff(event.endDate);
      }

      if (angular.isDefined(event.duration)) {
        event.durationString = moment.duration(event.duration, 'ms').humanize();
      } else {
        event.durationString = gettext('Unknown');
      }

      switch (event.type) {
        case 'Building':
          event.name = 'Build';
          // Only consider successful events for now on
          if (event.state === 'succeeded' && lastEvents.build.mEndData.diff(event.mEndDate) < 0) {
            lastEvents.build.mEndData = event.mEndDate;
            lastEvents.build.event = event;
          }
          break;
        case 'Testing':
          event.name = 'Test';
          // Only consider successful events for now on
          if (event.state === 'succeeded' && lastEvents.test.mEndData.diff(event.mEndDate) < 0) {
            lastEvents.test.mEndData = event.mEndDate;
            lastEvents.test.event = event;
          }
          break;
        case 'Deploying':
          event.name = 'Deploy';
          // Only consider successful events for now on
          if (event.state === 'succeeded' && lastEvents.deploy.mEndData.diff(event.mEndDate) < 0) {
            lastEvents.deploy.mEndData = event.mEndDate;
            lastEvents.deploy.event = event;
          }
          break;
        case 'pipeline_complete':
          event.name = 'Completed';
          break;
      }
    },

    /**
     * @name ApplicationDeliveryLogsController.parseExecution
     * @description Update the execution to contain the required information. Due to the way search works ensure all
     * dates and text is localised before it hits the scope
     * @param {object} execution - execution to update
     * @param {array} events - HCE events associated with the execution
     */
    parseExecution: function(execution, events) {
      // Localise the reason creation date string (use i18n date/time format)
      execution.reason.createdDateString = this.moment(execution.reason.createdDate).format('L - LTS');

      this.determineExecutionResult(execution, events);
    },

    /**
     * @name ApplicationDeliveryLogsController.determineExecutionResult
     * @description The execution result is actually junk, need to look at the latest execution event and use that
     * as the execution result. Also required to update the result with translated text, which makes is searchable.
     * Lastly, assume that a successful 'Building' event at the end of an execution means that it's currently 'Testing'
     * (same applies for Testing and Deploying).
     * @param {object} execution - execution to update
     * @param {array} events - HCE events associated with the execution
     */
    determineExecutionResult: function(execution, events) {
      if (!events || events.length === 0) {
        execution.result = undefined;
        return;
      }

      var event = events[events.length - 1];

      if (event.state === 'succeeded') {
        switch (event.type) {
          case 'Building':
            this.addInProgressEvent(events, event, 'Testing');
            event = events[events.length - 1];
            break;
          case 'Testing':
            this.addInProgressEvent(events, event, 'Deploying');
            event = events[events.length - 1];
            break;
          case 'Deploying':
            this.addInProgressEvent(events, event, 'Finalising');
            event = events[events.length - 1];
            break;
        }
      }

      execution.result = {
        state: event.state,
        label: event.name
      };

    },

    addInProgressEvent: function(events, previousEvent, name) {
      var newEvent = {
        startDate: previousEvent.endDate,
        name: name,
        type: 'inprogress',
        state: 'running'
      };
      this.parseEvent(newEvent);
      events.push(newEvent);
    },

    createMockExecutions: function() {
      return [
        {
          concoursePipelineId: '1362eeb20-219f-11e6-8838-71fe4dbc2489',
          id: 91,
          message: 'Update lastupdated.txt',
          name: 'Commit number 2',
          reason: {
            author: 'DBaldwin',
            avatarUrl: 'https://avatars.githubusercontent.com/u/18697775?v=3',
            commitSha: '123d97f1fc9189c9a9fcc66978e3c85af856262fe',
            commitUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            compareUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            createdDate: moment().subtract(46, 'seconds').format(),
            pullRequestId: null,
            type: 'manual'
          },
          result: 'Failure'
        },
        {
          concoursePipelineId: '2362eeb20-219f-11e6-8838-71fe4dbc2489',
          id: 92,
          message: 'Update lastupdated.txt',
          name: 'Commit number 2',
          reason: {
            author: 'DBaldwin',
            avatarUrl: 'https://avatars.githubusercontent.com/u/18697775?v=3',
            commitSha: '123d97f1fc9189c9a9fcc66978e3c85af856262fe',
            commitUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            compareUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            createdDate: moment().subtract(460, 'seconds').format(),
            pullRequestId: null,
            type: 'manual'
          },
          result: 'Success'
        },
        {
          concoursePipelineId: '3362eeb20-219f-11e6-8838-71fe4dbc2489',
          id: 93,
          message: 'Fixed the log in so logs go in',
          name: 'Change to log in',
          reason: {
            author: 'JAubrey',
            avatarUrl: 'https://avatars.githubusercontent.com/u/18697775?v=3',
            commitSha: '423d97aasdasfffcc66978e3c85af856262fe',
            commitUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            compareUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            createdDate: moment().subtract(4606, 'seconds').format(),
            pullRequestId: null,
            type: 'manual'
          },
          result: 'Deploying'
        },
        {
          concoursePipelineId: '4362eeb20-219f-11e6-8838-71fe4dbc2489',
          id: 94,
          message: 'Fixed broken broker',
          name: 'Fixed broken broker',
          reason: {
            author: 'GNuman',
            avatarUrl: 'https://avatars.githubusercontent.com/u/18697775?v=3',
            commitSha: '523d97f1fc9189c9a9fcc66978e3c85af856262fe',
            commitUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            compareUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            createdDate: moment().subtract(50064, 'seconds').format(),
            pullRequestId: null,
            type: 'manual'
          },
          result: 'Success'
        },
        {
          concoursePipelineId: '5362eeb20-219f-11e6-8838-71fe4dbc2489',
          id: 95,
          message: 'Break the build',
          name: 'Break the build',
          reason: {
            author: 'BAtman',
            avatarUrl: 'https://avatars.githubusercontent.com/u/18697775?v=3',
            commitSha: '623d97f1fc9189c9a9fcc66978e3c85af856262fe',
            commitUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            compareUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            createdDate: moment().subtract(55064, 'seconds').format(),
            pullRequestId: null,
            type: 'because why not'
          },
          result: 'unknown'
        },
        {
          concoursePipelineId: '6362eeb20-219f-11e6-8838-71fe4dbc2489',
          id: 96,
          message: 'Break the build',
          name: 'Break the build',
          reason: {
            author: 'BAtman',
            avatarUrl: 'https://avatars.githubusercontent.com/u/18697775?v=3',
            commitSha: '623d97f1fc9189c9a9fcc66978e3c85af856262fe',
            commitUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            compareUrl: 'https://github.com/richard-cox/empty-nodejs-application/commit/23d97f1fc9189c9a9fcc66978e3c85af856262fe',
            createdDate: moment().subtract(60064, 'seconds').format(),
            pullRequestId: null,
            type: 'manual'
          },
          result: 'Failure'
        },
        {
          id: 1,
          concoursePipelineId: 'ad291070-2bea-11e6-bd82-61cf59328c85',
          name: 'Merge pull request #6 from Stackato-Apps/gorouter-bug-workaround\n\nApp-side workaround for CF gorouter bug',
          result: 'Enqueued Build',
          message: 'Merge pull request #6 from Stackato-Apps/gorouter-bug-workaround\n\nApp-side workaround for CF gorouter bug',
          project: {
            applicationImage: {},
            buildContainer: {},
            repo: {}
          },
          reason: {
            author: 'btat',
            avatarUrl: 'https://avatars.githubusercontent.com/u/1832069?v=3',
            commitUrl: 'https://github.com/richard-cox/node-env/commit/85db6972f573b6a9f8bb24a5ee060d1c77ee4b19',
            commitSha: '85db6972f573b6a9f8bb24a5ee060d1c77ee4b19',
            createdDate: '2016-06-06T13:29:21Z',
            type: 'manual'
          }
        },
        {
          id: 2,
          concoursePipelineId: 'd5a6d6a0-2bfd-11e6-bd82-61cf59328c85',
          name: 'Merge pull request #6 from Stackato-Apps/gorouter-bug-workaround\n\nApp-side workaround for CF gorouter bug',
          result: 'Enqueued Build',
          message: 'Merge pull request #6 from Stackato-Apps/gorouter-bug-workaround\n\nApp-side workaround for CF gorouter bug',
          project: {
            applicationImage: {},
            buildContainer: {},
            repo: {}
          },
          reason: {
            author: 'btat',
            avatarUrl: 'https://avatars.githubusercontent.com/u/1832069?v=3',
            commitUrl: 'https://github.com/richard-cox/node-env/commit/85db6972f573b6a9f8bb24a5ee060d1c77ee4b19',
            commitSha: '85db6972f573b6a9f8bb24a5ee060d1c77ee4b19',
            createdDate: '2016-06-06T15:46:29Z',
            type: 'manual'
          }
        },
        {
          id: 3,
          concoursePipelineId: 'c5a3e940-2bfe-11e6-bd82-61cf59328c85',
          name: 'Update manifest.yml',
          result: 'Enqueued Build',
          message: 'Update manifest.yml',
          project: {
            applicationImage: {},
            buildContainer: {},
            repo: {}
          },
          reason: {
            author: 'richard-cox',
            avatarUrl: 'https://avatars.githubusercontent.com/u/18697775?v=3',
            commitUrl: 'https://github.com/richard-cox/node-env/commit/4ae6c69033da93c8b484ce61b9d726e10524a988',
            commitSha: '4ae6c69033da93c8b484ce61b9d726e10524a988',
            createdDate: '2016-06-06T15:53:12Z',
            type: 'manual'
          }
        }
      ];
    },

    createMockEvents: function(executionId) {
      function createEvent(id, type, state, startOffset, endOffset) {
        return {
          id: id,
          name: type,
          type: type,
          state: state,
          startDate: moment().subtract(startOffset, 'seconds').format(),
          endDate: moment().subtract(endOffset, 'seconds').format(),
          artifactId: id,
          duration: (endOffset - startOffset) * 1000
        };
      }

      switch (executionId) {
        case 91:
          return [
            createEvent(90, 'Building', 'failed', 46, 40, 91)
          ];
        case 92:
          return [
            createEvent(91, 'Building', 'succeeded', 500, 510, 92),
            createEvent(92, 'Testing', 'succeeded', 600, 650, 92),
            createEvent(93, 'Deploying', 'failed', 650, 40, 92)
          ];
        case 93:
          return [
            createEvent(94, 'Building', 'succeeded', 4606, 4600, 93),
            createEvent(95, 'Testing', 'succeeded', 4600, 4560, 93)
            // createEvent(96, 'Deploying', 'deploying', 4560, 4510, 93)
          ];
        case 94:
          return [
            createEvent(97, 'Building', 'succeeded', 50064, 50060, 94),
            createEvent(98, 'Testing', 'succeeded', 50055, 50050, 94),
            createEvent(99, 'Deploying', 'succeeded', 50050, 50045, 94)
          ];
        case 95:
          return [];
        case 96:
          return [
            createEvent(100, 'Building', 'succeeded', 60064, 60060, 96),
            createEvent(101, 'Testing', 'failed', 60060, 60000, 96)
          ];
        case 1:
          return [
            {
              id: 1,
              name: "Building",
              type: "Building",
              state: "succeeded",
              startDate: "2016-06-06T13:29:44.000Z",
              endDate: "2016-06-06T13:29:45.000Z",
              execution_id: 1,
              artifact_id: 1
            },
            {
              id: 2,
              name: "Testing",
              type: "Testing",
              state: "succeeded",
              startDate: "2016-06-06T13:29:44.000Z",
              endDate: "2016-06-06T13:30:16.000Z",
              execution_id: 1,
              artifact_id: 2
            }, {
              id: 3,
              name: "Watchdog Terminated",
              type: "watchdog",
              state: "failed",
              startDate: "2016-06-06T13:31:55.000Z",
              endDate: "2016-06-06T13:31:55.000Z",
              execution_id: 1,
              artifact_id: 3
            }
          ];
        case 2:
          return [
            {
              "id": 4,
              "name": "Watchdog Terminated",
              "type": "watchdog",
              "state": "failed",
              "startDate": "2016-06-06T15:51:04.000Z",
              "endDate": "2016-06-06T15:51:04.000Z",
              "execution_id": 2,
              "artifact_id": 4
            }
          ];
        case 3:
          return [];

      }
    }
  });

})();
