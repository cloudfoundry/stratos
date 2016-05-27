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

    var that = this;
    var updateModelPromise;

    /* eslint-disable */
    // TODO (kdomico): Hi! I've used the same github user approach. Update here as well or let me know if I need to do it
    // TODO (rcox): Improvements - Check if project id already exists in hce model?
    /* eslint-enable */
    that.hceModel.getUserByGithubId('18697775')
      .then(function () {
        return that.hceModel.getProjects();
      })
      .then(function () {
        that.model.application.summary.name = 'test';// Temp override
        return that.hceModel.getProject(that.model.application.summary.name);
      })
      .then(function (project) {
        that.hasProject = !(angular.isUndefined(project) || project === null);
        if (that.hasProject) {
          updateData();
          updateModelPromise = $interval(updateData, 30 * 1000, 0, true);
        }
      })
      .catch(function (error) {
        $log.error('Failed to fetch project or process delivery logs data: ', error);
        that.hasProject = 'error';
      });

    /* eslint-disable */
    // TODO (rcox): Need to optimise for projects with large amount of executions/builds
    // - only process visible executions
    // - Don't fetch events for all executions
    // - See TEAMFOUR-375
    /* eslint-enable */
    function updateData() {
      var project = that.hceModel.getProject(that.model.application.summary.name);
      // Fetch pipeline executions
      return that.hceModel.getPipelineExecutions(project.id)
        .then(function () {
          // ParseFetch pipeline execution's events

          that.eventsPerExecution = {};

          var fetchEventsPromises = [];
          for (var i = 0; i < that.hceModel.data.pipelineExecutions.length; i++) {
            fetchEventsPromises.push(fetchEvents(that.eventsPerExecution, that.hceModel.data.pipelineExecutions[i].id));
          }
          return $q.all(fetchEventsPromises);
        })
        .then(function() {
          addMockData();
        })
        .then(function () {
          // Discover the last successful build/test/deploy events
          that.last = {
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

          _.forEach(that.eventsPerExecution, function parseEvents(events) {
            if (!events || events.length === 0) {
              return;
            }

            for (var i = 0; i < events.length; i++) {
              parseEvent(events[i], that.last);
            }
          });
          // that.last.build = _.find(that.hceModel.data.pipelineExecutions, { id: that.last.build});
          // that.last.test = _.find(that.hceModel.data.pipelineExecutions, { id: that.last.test});
          // that.last.deploy = _.find(that.hceModel.data.pipelineExecutions, { id: that.last.deploy});
        })
        .then(function () {
          // The ux will need to show the translated & localise date/time in the table. In order for the search filter
          // for the table to work this conversion needs to happen before being pushed to scope. So two options,
          // either append these values to to existing hceModel.data object or clone and update as needed for this
          // specific directive
          /* eslint-disable */
          that.parsedHceModel = JSON.parse(JSON.stringify(that.hceModel.data));
          /* eslint-enable */

          for (var i = 0; i < that.parsedHceModel.pipelineExecutions.length; i++) {
            var execution = that.parsedHceModel.pipelineExecutions[i];
            parseExecution(that.parsedHceModel.pipelineExecutions, execution, i);
          }
        })
        .catch(function (error) {
          $log.error('Failed to fetch/process pipeline executions or events: ', error);
        });
    }

    function fetchEvents(eventsPerExecution, executionId) {
      return that.hceModel.getPipelineEvents(executionId)
        .then(function(events) {
          if (eventsPerExecution[executionId]) {
            // used with mock, to be removed
            return;
          }
          eventsPerExecution[executionId] = events;
        });
    }

    function parseEvent(event, lastEvents) {
      if (event.duration) {
        event.durationString = moment.duration(event.duration, 'ms').humanize();
      }

      // Only consider successful events for now on
      if (event.state !== "succeeded") {
        return;
      }

      var thisEventTime = moment(event.endDate);
      switch (event.type) {
        case 'Building':
          if (lastEvents.build.mEndData.diff(thisEventTime) < 0) {
            lastEvents.build.mEndData = thisEventTime;
            that.last.build.event = event;
          }
          break;
        case 'Testing':
          if (lastEvents.test.mEndData.diff(thisEventTime) < 0) {
            lastEvents.test.mEndData = thisEventTime;
            that.last.test.event = event;
          }
          break;
        case 'Deploying':
          if (lastEvents.deploy.mEndData.diff(thisEventTime) < 0) {
            lastEvents.deploy.mEndData = thisEventTime;
            that.last.deploy.event = event;
          }
          break;
      }
    }

    function parseExecution(executions, execution, pos) {
      // The ux will filter the executions by the values within the object on scope. Need to ensure that only visible
      // entries are in the scope. Additionally any translated text or localise date/time must be done up front.

      // Localise the reason creation date string (use i18n date/time format)
      execution.reason.createdDateString = moment(execution.reason.createdDate).format('L - LTS');

      // Update the result with translated text
      var events = that.eventsPerExecution[execution.id];
      if (events && events.length > 0) {
        var lastEvent, lastEventTime;
        for (var i = 0; i < events.length; i++) {
          var event = events[i];
          var thisEventTime = moment(event.endDate);
          if (angular.isUndefined(lastEventTime) || lastEventTime.diff(thisEventTime) < 0) {
            lastEventTime = thisEventTime;
            lastEvent = event;
          }
        }
        execution.result = {
          state: lastEvent.state,
          label: lastEvent.type
        };
      } else {
        execution.result = undefined;
      }
    }

    function addMockData() {
      var mocked = [
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
        }
      ];
      that.hceModel.data.pipelineExecutions = that.hceModel.data.pipelineExecutions.concat(mocked);

      that.eventsPerExecution['91'] = [
        createEvent(90, 'Building', 'failed', 46, 40, 91)
      ];
      that.eventsPerExecution['92'] = [
        createEvent(91, 'Building', 'succeeded', 500, 510, 92),
        createEvent(92, 'Testing', 'succeeded', 600, 650, 92),
        createEvent(93, 'Deploying', 'failed', 650, 40, 92)
      ];
      that.eventsPerExecution['93'] = [
        createEvent(94, 'Building', 'succeeded', 4606, 4600, 93),
        createEvent(95, 'Testing', 'succeeded', 4600, 4560, 93),
        createEvent(96, 'Deploying', 'running', 4560, 4510, 93)
      ];
      that.eventsPerExecution['94'] = [
        createEvent(97, 'Building', 'succeeded', 50064, 50060, 94),
        createEvent(98, 'Testing', 'succeeded', 50055, 50050, 94),
        createEvent(99, 'Deploying', 'succeeded', 50050, 50045, 94)
      ];
      that.eventsPerExecution['95'] = [];
      that.eventsPerExecution['96'] = [
        createEvent(91, 'Building', 'succeeded', 60064, 60060, 96),
        createEvent(92, 'Testing', 'failed', 60060, 60000, 96)
      ];

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
    }

    $scope.$on("$destroy", function () {
      if (updateModelPromise) {
        $interval.cancel(updateModelPromise);
      }
    });

    this.id = $stateParams.guid;
    this.detailView = detailView;
  }

  angular.extend(ApplicationDeliveryLogsController.prototype, {

    triggerBuild: function () {
      /* eslint-disable */
      alert('TODO: trigger build');
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
      var latestEvent, lastEventTime;
      _.forEach(events, function (event) {
        if (!lastEventTime || lastEventTime.diff(event.endDate) < 0) {
          lastEventTime = moment(event.endDate);
          latestEvent = event;
        }
      });

      if (latestEvent) {
        this.viewEvent(latestEvent);
      }
    },

    viewEvent: function (event) {
      this.detailView({
        templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/details/event.html',
        controller: 'eventDetailViewController',
        title: event.type
      }, {
        event: event
      });
    }
  });

})();
