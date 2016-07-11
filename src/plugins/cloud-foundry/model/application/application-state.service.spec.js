(function () {
  'use strict';

  describe('application state service', function () {
    var $httpBackend, appStateService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      appStateService = $injector.get('cloud-foundry.model.application.stateService');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('getAppSummary', function () {
      expect(appStateService).not.toBe(null);
    });

    describe('check friendly names and indicators', function () {

      function makeTestData(appState, packageState, instanceSstates) {
        var summary = {
          state: appState,
          package_state: packageState,
          running_instances: 0,
          instances: instanceSstates.length
        };
        var instances = [];
        var running = 0;
        _.each(instanceSstates, function (s) {
          instances.push({state: s});
          if (s === 'RUNNING') { running++; }
        });
        summary .running_instances = running;
        return {
          summary: summary,
          instances: instances
        };
      }

      it('Busted push', function () {
        var testData = makeTestData('ANY', 'FAILED', ['RUNNING']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('error');
        expect(res.label).toBe('Staging Failed');
      });

      it('Updating app', function () {
        var testData = makeTestData('STOPPED', 'PENDING', ['RUNNING', 'CRASHED']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('warning');
        expect(res.label).toBe('Offline while Updating');
      });

      it('User stopped app', function () {
        var testData = makeTestData('STOPPED', 'STAGED', ['RUNNING', 'CRASHED']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('warning');
        expect(res.label).toBe('Offline');
      });

      it('Incomplete', function () {
        var testData = makeTestData('STOPPED', undefined, ['RUNNING', 'CRASHED']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('warning');
        expect(res.label).toBe('Incomplete');
      });

      it('During push', function () {
        var testData = makeTestData('STARTED', 'PENDING', ['RUNNING', 'CRASHED']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('busy');
        expect(res.label).toBe('Staging App');
      });

      it('After successful push', function () {
        var testData = makeTestData('STARTED', 'STAGED', []);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('busy');
        expect(res.label).toBe('Starting App');
      });

      it('Running!', function () {
        var testData = makeTestData('STARTED', 'STAGED', ['RUNNING']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('ok');
        expect(res.label).toBe('Online');

        testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'RUNNING']);
        res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('ok');
        expect(res.label).toBe('Online');
      });

      it('Borked, usually due to app code', function () {
        var testData = makeTestData('STARTED', 'STAGED', ['CRASHED']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('error');
        expect(res.label).toBe('Crashed');

        testData = makeTestData('STARTED', 'STAGED', ['CRASHED', 'CRASHED']);
        res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('error');
        expect(res.label).toBe('Crashed');
      });

      it('Borked, usually due to starting timeouts', function () {
        var testData = makeTestData('STARTED', 'STAGED', ['TIMEOUT']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('error');
        expect(res.label).toBe('Crashing');

        testData = makeTestData('STARTED', 'STAGED', ['TIMEOUT', 'TIMEOUT']);
        res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('error');
        expect(res.label).toBe('Crashing');
      });

      it('Borked, usually due to starting timeouts', function () {
        var testData = makeTestData('STARTED', 'STAGED', ['TIMEOUT', 'CRASHED']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('error');
        expect(res.label).toBe('Crashing');

        testData = makeTestData('STARTED', 'STAGED', ['TIMEOUT', 'TIMEOUT', 'CRASHED', 'CRASHED']);
        res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('error');
        expect(res.label).toBe('Crashing');
      });

      it('Borked, usually due to platform issues', function () {
        var testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'CRASHED']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('warning');
        expect(res.label).toBe('Partially Online');

        testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'RUNNING', 'CRASHED', 'CRASHED']);
        res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('warning');
        expect(res.label).toBe('Partially Online');
      });

      it('Borked, usually due to platform issues (2)', function () {
        var testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'UNKNOWN']);
        var res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('warning');
        expect(res.label).toBe('Partially Online');

        testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'RUNNING', 'UNKNOWN', 'UNKNOWN']);
        res = appStateService.get(testData.summary, testData.instances);
        expect(res.indicator).toBe('warning');
        expect(res.label).toBe('Partially Online');
      });
    });

  });

})();
