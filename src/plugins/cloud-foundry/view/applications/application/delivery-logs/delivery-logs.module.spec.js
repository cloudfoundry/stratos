(function () {
  'use strict';

  describe('Delivery Logs', function () {

    var controller, $stateParams, $q, $log, moment, $state, $rootScope, hceModel, cnsiModel, modelManager,
      $httpBackend, viewEvent, viewExecution, triggerBuild;

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry.view.applications.application.delivery-logs'));

    // Define some common properties used throughout tests
    var application = {
      summary: {
        name: 'appName'
      },
      pipeline: {
        fetching: false,
        valid: true,
        hce_api_url: 'test',
        hceCnsi: {
          guid: 1234
        }
      },
      project: null
    };

    var cnsi = {guid: 1234, name: 'appName', url: ' cluster2_url', cnsi_type: 'hce'};
    var project = {name: application.summary.name, id: '4321'};
    var projects = {};
    projects[project.name] = [project];

    function fakeModelCall(obj, func, reject, result, applyResultToProp) {
      // There's a number of places where we intercept requests to 'model' objects and supply out own response/data.
      // This could have called the actual models and then intercepted the http requests... however wanted to make
      // this test as independent as possible from anything going on in model land.
      spyOn(obj, func).and.callFake(function () {
        if (reject) {
          return $q.reject({status: reject});
        }
        if (applyResultToProp) {
          _.set(obj, applyResultToProp, result);
        }

        return $q.when(result);
      });
    }

    beforeEach(inject(function (_$stateParams_, _$q_, _$log_, _moment_, $injector, _$state_, _$rootScope_,
                                _viewEventDetailView_, _viewExecutionDetailView_, _triggerBuildDetailView_) {
      // Create the parameters required by the ctor
      $stateParams = _$stateParams_;
      $q = _$q_;
      $log = _$log_;
      moment = _moment_;
      modelManager = $injector.get('app.model.modelManager');
      viewEvent = _viewEventDetailView_;
      viewExecution = _viewExecutionDetailView_;
      triggerBuild = _triggerBuildDetailView_;

      // Some generic vars needed in tests
      $state = _$state_;
      $rootScope = _$rootScope_;
      $httpBackend = $injector.get('$httpBackend');

      // Store the model functions that the constructor calls out to. These functions will be monitored and overwritten
      var model = modelManager.retrieve('cloud-foundry.model.application');
      _.set(model, 'application', application);
      hceModel = modelManager.retrieve('cloud-foundry.model.hce');
      cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    }));

    function createController(ignoreRes) {
      // The controller can only be created after model override is defined, so create it separately on demand
      if (ignoreRes) {
        fakeModelCall(cnsiModel, 'list', 500);
      }

      var ApplicationDeliveryLogsController = $state.get('cf.applications.application.delivery-logs').controller;
      controller = new ApplicationDeliveryLogsController($rootScope.$new(), $stateParams, $q, $log, moment,
        modelManager, viewEvent, viewExecution, triggerBuild);

      expect(controller).toBeDefined();
    }

    function setProject() {
      var model = modelManager.retrieve('cloud-foundry.model.application');
      _.set(model.application, 'project', project);
    }

    function clearProject() {
      var model = modelManager.retrieve('cloud-foundry.model.application');
      _.set(model.application, 'project', null);
    }

    afterEach(function () {
      // Not necessarily needed, but will catch any requests that have not been overwritten.
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Ctor', function () {
      describe('Constructor test, pipeline metadata not fetched', function () {
        beforeEach(function () {
          var app = {
            summary: {
              name: 'appName'
            },
            pipeline: {
              fetching: true
            }
          };
          var model = modelManager.retrieve('cloud-foundry.model.application');
          _.set(model, 'application', app);
        });

        it('Initial state', function () {
          fakeModelCall(cnsiModel, 'list', true, 'serviceInstances');

          createController();

          expect(controller.model).not.toBeNull();
          expect(controller.hceModel).not.toBeNull();
          expect(controller.cnsiModel).not.toBeNull();
          expect(controller.hceCnsi).not.toBeNull();
          expect(controller.hasProject).toEqual(false);
          expect(controller.last).not.toBeNull();
          expect(controller.id).not.toBeNull();
        });

        it('Constructor test, pipeline metadata not fetched', function () {
          createController();
          $rootScope.$apply();
          expect(controller.hasProject).toEqual(false);
        });
      });

      describe('Constructor test, pipeline metadata fetched', function () {
        it('no project', function () {
          createController();
          $rootScope.$apply();
          expect(controller.hasProject).toEqual(false);
        });

        it('has project', function () {
          setProject();
          fakeModelCall(hceModel, 'getPipelineExecutions', 500);
          createController();
          $rootScope.$apply();
          expect(controller.hasProject).toEqual(true);
          expect(controller.model.application.project).not.toEqual(null);
        });
      });
    });

    describe('Trigger Build', function () {
      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond([]);

        setProject();
        createController(true);
      });

      afterEach(function () {
        clearProject();
      });

      it('Shows slide out - success', function () {
        // Spy on the required functions to be called as a result of trigger
        spyOn(triggerBuild, 'open').and.callFake(function (project, guid) {
          expect(project).toEqual(project);
          expect(guid).toEqual(cnsi.guid);
          return $q.when();
        });
        spyOn(controller, 'updateData');

        controller.triggerBuild();
        $httpBackend.flush();

        expect(triggerBuild.open).toHaveBeenCalled();
        expect(controller.updateData).toHaveBeenCalled();
      });

      it('Shows slide out - failure', function () {
        // Spy on the required functions to be called as a result of trigger
        spyOn(triggerBuild, 'open').and.callFake(function () {
          return $q.reject();
        });
        spyOn(controller, 'updateData');

        controller.triggerBuild();
        $httpBackend.flush();

        expect(triggerBuild.open).toHaveBeenCalled();
        expect(controller.updateData.calls.count()).toBe(1);
      });
    });

    describe('View Execution', function () {
      var now = new Date();
      var execution = {id: 'two'};
      var rawExecution = {id: 'two', junkParam: true, reason: { created_date: now }};
      var executions = [{id: 'one', reason: { created_date: now }}, rawExecution];
      var events = [
        {
          event: '3'
        }
      ];

      var eventsPerExecution = {
        one: [
          {
            event: '1'
          },
          {
            event: '2'
          }
        ],
        two: events
      };

      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond(executions);

        createController(true);
        $rootScope.$apply();
        setProject();

        $httpBackend.flush();

        _.set(controller, 'hceModel.data.pipelineExecutions', executions);
        _.set(controller, 'eventsPerExecution', eventsPerExecution);
      });

      afterEach(function () {
        clearProject();
      });

      it('Shows detail view', function () {
        // Spy on the required functions to be called as a result of trigger
        spyOn(viewExecution, 'open');

        controller.viewExecution(execution);

        expect(viewExecution.open).toHaveBeenCalled();
        expect(viewExecution.open.calls.argsFor(0).length).toBe(3);
        expect(viewExecution.open.calls.argsFor(0)[2]).toEqual(cnsi.guid);
        expect(viewExecution.open.calls.argsFor(0)[0]).toEqual(rawExecution);
        expect(viewExecution.open.calls.argsFor(0)[1]).toEqual(events);
      });
    });

    describe('Fetching events', function () {

      var event1 = {
        some: 'value1'
      };
      var event2 = {
        some: 'value2'
      };
      var eventsPerExecution = {};
      var executionId = '1';

      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond([]);

        createController(true);
        $rootScope.$apply();
        setProject();

        $httpBackend.flush();
      });

      afterEach(function () {
        clearProject();
      });

      afterEach(function () {
        expect(hceModel.getPipelineEvents).toHaveBeenCalled();
        expect(hceModel.getPipelineEvents.calls.argsFor(0)).toBeDefined();
        expect(hceModel.getPipelineEvents.calls.argsFor(0).length).toBe(2);
        expect(hceModel.getPipelineEvents.calls.argsFor(0)[0]).toEqual(cnsi.guid);
        expect(hceModel.getPipelineEvents.calls.argsFor(0)[1]).toEqual(executionId);
      });

      it('Failed call', function () {
        fakeModelCall(hceModel, 'getPipelineEvents', 500);

        controller.fetchEvents({}, executionId).then(function () {
          fail('Fetch should not have succeeded');
        });
      });

      it('Empty call', function () {
        fakeModelCall(hceModel, 'getPipelineEvents', false, [event1]);
        spyOn(controller, 'parseEvent');

        controller.fetchEvents(eventsPerExecution, executionId).then(function () {
          expect(eventsPerExecution[executionId]).toEqual([event1]);
          expect(controller.parseEvent).toHaveBeenCalledWith(event1);
        }).catch(function () {
          fail('Fetch should not have failed');
        });
      });

      it('Some events', function () {
        var events = [event1, event2];

        fakeModelCall(hceModel, 'getPipelineEvents', false, events);
        spyOn(controller, 'parseEvent');

        controller.fetchEvents(eventsPerExecution, executionId).then(function () {
          expect(eventsPerExecution[executionId]).toEqual(events);
          expect(controller.parseEvent).toHaveBeenCalledWith(event1);
          expect(controller.parseEvent).toHaveBeenCalledWith(event2);
        }).catch(function () {
          fail('Fetch should not have failed');
        });
      });
    });

    describe('parse event', function () {
      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond([]);

        createController(true);
        $rootScope.$apply();
        setProject();

        $httpBackend.flush();

        spyOn(controller, 'determineLatestEvent');
      });

      afterEach(function () {
        expect(controller.determineLatestEvent).toHaveBeenCalled();
        expect(controller.determineLatestEvent.calls.argsFor(0)[0]).toBeDefined();

        clearProject();
      });

      it('Empty event', function () {
        var event = {};
        controller.parseEvent(event);
        expect(event.mEndDate).toBeUndefined();
        expect(event.duration).toBeUndefined();
        expect(event.durationString).toEqual('Unknown');
        expect(event.name).toBeUndefined();
      });

      it('Populated event', function () {
        var event = {
          end_date: moment().format(),
          duration: 400,
          type: 'Building'
        };
        controller.parseEvent(event);
        expect(event.mEndDate).toBeDefined();
        expect(event.duration).toBeDefined();
        expect(event.durationString).toBeDefined();
        expect(event.durationString).not.toEqual('Unknown');
        expect(event.name).toBeDefined();
      });

      it('Populated event - calculate duration', function () {
        var event = {
          start_date: moment().subtract(100, 's').format(),
          end_date: moment().format()
        };
        controller.parseEvent(event);
        expect(event.mEndDate).toBeDefined();
        expect(event.duration).toBeDefined();
        expect(event.durationString).toBeDefined();
        expect(event.durationString).not.toEqual('Unknown');
      });

      it('Populated event - event types', function () {
        //['Building', 'Testing', 'Deploying', 'watchdog', 'pipeline_completed']
        var eventTypes = _.values(controller.eventTypes);
        expect(eventTypes.length).toBeGreaterThan(0);
        _.forEach(eventTypes, function (type) {
          var event = {
            type: type
          };
          controller.parseEvent(event);
          expect(event.name).toBeDefined();
        });
      });
    });

    describe('determine latest event', function () {

      var eventType = 'type';

      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond([]);

        createController(true);
        controller.last = {};
        $rootScope.$apply();
        setProject();

        $httpBackend.flush();
      });

      afterEach(function () {
        clearProject();
      });

      it('no previous event of this type used', function () {
        var event = {
          id: 1,
          type: eventType
        };
        controller.determineLatestEvent(event);
        expect(controller.last[eventType]).toEqual(event);
      });

      it('later event but not succeeded', function () {
        var event = {
          id: 1,
          type: eventType
        };
        controller.last[eventType] = event;

        var laterEvent = {
          id: 2,
          type: eventType
        };

        controller.determineLatestEvent(laterEvent);
        expect(controller.last[eventType]).toEqual(event);
      });

      it('succeeded event but not later', function () {
        var event = {
          id: 1,
          type: eventType,
          state: controller.eventStates.SUCCEEDED
        };
        controller.last[eventType] = event;

        var laterEvent = {
          id: 2,
          type: eventType
        };

        controller.determineLatestEvent(laterEvent);
        expect(controller.last[eventType]).toEqual(event);
      });

      it('succeeded and later event', function () {
        var event = {
          id: 1,
          type: eventType
        };
        controller.last[eventType] = event;

        var laterEvent = {
          id: 2,
          type: eventType,
          state: controller.eventStates.SUCCEEDED
        };

        controller.determineLatestEvent(laterEvent);
        expect(controller.last[eventType]).toEqual(laterEvent);
      });

    });

    describe('parse execution', function () {
      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond([]);

        createController(true);
        $rootScope.$apply();
        setProject();

        $httpBackend.flush();
      });

      afterEach(function () {
        clearProject();
      });

      it('no events obj', function () {
        var execution = {
          reason: {
            created_date: moment().format()
          }
        };
        controller.parseExecution(execution);
        expect(execution.result).toBeUndefined();
      });

      it('empty events obj', function () {
        var execution = {
          reason: {
            created_date: moment().format()
          }
        };
        controller.parseExecution(execution, []);
        expect(execution.result).toBeUndefined();
      });

      it('sets moment created date', function () {
        var execution = {
          reason: {
            created_date: moment().format()
          }
        };
        controller.parseExecution(execution);
        expect(execution.reason.mCreatedDate).toBeDefined();
      });

      it('sets correct \'result\' property', function () {
        var execution = {
          reason: {
            created_date: moment().format()
          }
        };
        var event = {
          name: 'event name',
          artifact_id: 'artifact id'
        };
        var events = [event];
        controller.parseExecution(execution, events);
        expect(execution.result).toBeDefined();
        expect(execution.result.state).toBeDefined();
        expect(execution.result.label).toEqual(event.name);
      });
    });

    describe('determine execution result', function () {

      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond([]);

        createController(true);
        $rootScope.$apply();
        setProject();

        $httpBackend.flush();
      });

      afterEach(function () {
        clearProject();
      });

      it('execution completed (pipeline_complete - failed)', function () {
        var event = {
          type: controller.eventTypes.PIPELINE_COMPLETED,
          state: controller.eventStates.FAILED,
          name: 'label'
        };
        var res = controller.determineExecutionResult(event);
        expect(res.label).toEqual('Failed');
        expect(res.state).toEqual(event.state);
      });

      it('execution completed (pipeline_complete - success)', function () {
        var event = {
          type: controller.eventTypes.PIPELINE_COMPLETED,
          state: controller.eventStates.SUCCEEDED,
          name: 'label'
        };
        var res = controller.determineExecutionResult(event);
        expect(res.label).toEqual('Success');
        expect(res.state).toEqual(event.state);
      });

      it('execution completed (failed event)', function () {
        var event = {
          type: controller.eventTypes.TESTING,
          state: controller.eventStates.FAILED,
          name: 'label'
        };
        var res = controller.determineExecutionResult(event);
        expect(res.label).toEqual(event.name);
        expect(res.state).toEqual(event.state);
      });

      it('execution still running', function () {
        var event = {
          type: controller.eventTypes.TESTING,
          name: 'label'
        };
        var res = controller.determineExecutionResult(event);
        expect(res.label).toEqual(event.name);
        expect(res.state).toEqual(controller.eventStates.RUNNING);
      });

      it('results for all states', function () {
        var types = _.values(controller.eventTypes);
        _.forEach(types, function (type) {
          var origState = 'orig';
          var event = {
            type: type,
            state: origState,
            name: 'Name'
          };
          var state = controller.determineExecutionResult(event);
          switch (type) {
            case controller.eventTypes.BUILDING:
            case controller.eventTypes.TESTING:
            case controller.eventTypes.DEPLOYING:
              expect(state.label).toEqual(event.name);
              expect(state.state).toEqual(controller.eventStates.RUNNING);
              break;
            case controller.eventTypes.PIPELINE_COMPLETED:
              expect(state.state).toEqual(origState);
              expect(state.label).toEqual('Failed');
              break;
            case controller.eventTypes.WATCHDOG_TERMINATED:
              expect(state.state).toEqual(origState);
              expect(state.label).toEqual(event.name);
              break;
            default:
              fail('Unknown event type: ' + type);
              break;
          }
        });
      });

    });

    describe('dynamic loading of events when execution visible - updateVisibleExecutions', function () {
      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond([]);

        createController(true);
        $rootScope.$apply();
        setProject();

        $httpBackend.flush();

        // Call updateModel to set up watch, we'll test if this watch is correctly called
        spyOn(hceModel, 'getProject').and.callFake(function () {
          return project;
        });
        spyOn(hceModel, 'getPipelineExecutions').and.callFake(function () {
          return $q.when();
        });
        _.set(controller, 'hceModel.data.pipelineExecutions', []);
        controller.updateData();
        $rootScope.$apply();
      });

      afterEach(function () {
        clearProject();
      });

      it('Nothing visible? Nothing to update', function () {
        spyOn(controller, 'fetchEvents');
        controller.updateVisibleExecutions();
        expect(controller.fetchEvents).not.toHaveBeenCalled();
        controller.updateVisibleExecutions([]);
        expect(controller.fetchEvents).not.toHaveBeenCalled();
      });

      it('fetch event fails', function () {
        var visibleExecutions = [
          {
            id: 'one'
          }
        ];
        spyOn(controller, 'parseExecution');
        spyOn(controller, 'fetchEvents').and.callFake(function (eventsPerExecution, id) {
          expect(eventsPerExecution).toEqual({});
          expect(id).toEqual('one');
          return $q.reject();
        });

        controller.updateVisibleExecutions(visibleExecutions);

        expect(controller.parseExecution).not.toHaveBeenCalled();
      });

      it('all events already downloaded', function () {
        var execution = {
          id: 'one',
          reason: {
            created_date: moment().format()
          },
          result: {completed: true}
        };
        var eventsPerExecution = {};
        eventsPerExecution[execution.id] = {};
        _.set(controller, 'eventsPerExecution', eventsPerExecution);

        spyOn(controller, 'fetchEvents');
        spyOn(controller, 'parseExecution');

        var visibleExecutions = [execution];
        controller.updateVisibleExecutions(visibleExecutions);

        expect(controller.fetchEvents).not.toHaveBeenCalled();
        expect(controller.parseExecution).not.toHaveBeenCalled();
      });

      it('fetch event succeeds', function () {
        var execution = {
          id: 'one',
          reason: {
            created_date: moment().format()
          }
        };
        var events = [
          {
            id: 'two'
          },
          {
            id: 'three'
          }
        ];
        var visibleExecutions = [execution];
        var allExecutions = [execution];

        _.set(controller, 'parsedHceModel.pipelineExecutions', allExecutions);
        spyOn(controller, 'fetchEvents').and.callFake(function (eventsPerExecution, id) {
          expect(eventsPerExecution).toEqual({});
          expect(id).toEqual('one');
          eventsPerExecution[id] = events;
          return $q.when(events);
        });
        spyOn(controller, 'parseExecution').and.callThrough();
        spyOn(controller, 'execWatch');

        controller.updateVisibleExecutions(visibleExecutions);
        $rootScope.$apply();

        // Ensure that for execution has been updated given the events fetched
        expect(controller.parseExecution).toHaveBeenCalled();
        expect(controller.parseExecution.calls.count()).toBe(1);
        expect(controller.parseExecution.calls.argsFor(0).length).toBe(2);
        expect(controller.parseExecution.calls.argsFor(0)[0]).toEqual(execution);
        expect(controller.parseExecution.calls.argsFor(0)[1]).toEqual(events);

        // All executions have had their events downloaded, so ensure the call to stop watching is made
        expect(controller.execWatch).toHaveBeenCalled();

      });

      it('fetch event succeeds, watch should not be killed', function () {
        var execution1 = {
          id: 'one',
          reason: {
            created_date: moment().format()
          }
        };
        var execution2 = {
          id: 'two',
          reason: {
            created_date: moment().format()
          }
        };
        var events = [
          {
            id: 'two'
          },
          {
            id: 'three'
          }
        ];
        var visibleExecutions = [execution1];
        var allExecutions = [execution1, execution2];

        _.set(controller, 'parsedHceModel.pipelineExecutions', allExecutions);
        spyOn(controller, 'fetchEvents').and.callFake(function (eventsPerExecution, id) {
          expect(eventsPerExecution).toEqual({});
          expect(id).toEqual('one');
          eventsPerExecution[id] = events;
          return $q.when(events);
        });
        spyOn(controller, 'parseExecution').and.callThrough();
        spyOn(controller, 'execWatch');

        controller.updateVisibleExecutions(visibleExecutions);
        $rootScope.$apply();

        // Ensure that for execution has been updated given the events fetched
        expect(controller.parseExecution).toHaveBeenCalled();
        expect(controller.execWatch).not.toHaveBeenCalled();

      });

    });

    describe('update data', function () {

      var execution;

      beforeEach(function () {
        var request = '/pp/v1/proxy/v2/pipelines/executions?project_id=4321';
        $httpBackend.expectGET(request).respond([]);

        createController(true);
        $rootScope.$apply();
        setProject();

        execution = {
          reason: {
            created_date: moment().format()
          }
        };

        $httpBackend.flush();
      });

      afterEach(function () {
        clearProject();
      });

      it('get executions fails', function () {
        controller.parsedHceModel = undefined;
        spyOn(hceModel, 'getPipelineExecutions').and.callFake(function () {
          return $q.reject();
        });

        controller.updateData();
        expect(controller.hceModel.getPipelineExecutions).toHaveBeenCalled();
        expect(controller.parsedHceModel).toBeUndefined();
      });

      it('pipeline result cloned successfully, execution is parsed', function () {
        controller.parsedHceModel = undefined;
        spyOn(hceModel, 'getPipelineExecutions').and.callFake(function (guid, projectId) {
          expect(guid).toEqual(cnsi.guid);
          expect(projectId).toEqual(project.id);
          _.set(hceModel, 'data.pipelineExecutions', [execution]);
          return $q.when();
        });
        spyOn(controller, 'parseExecution').and.callFake(function (inExecution, inEvents) {
          expect(inExecution).toEqual(execution);
          expect(inEvents).toBeUndefined(inEvents);
        });

        controller.updateData();
        $rootScope.$apply();

        expect(hceModel.getPipelineExecutions).toHaveBeenCalled();
        expect(controller.parsedHceModel).toEqual(hceModel.data);
        expect(controller.parsedHceModel).not.toBe(hceModel.data);
        expect(controller.parseExecution).toHaveBeenCalled();
      });
    });

  });

})();
