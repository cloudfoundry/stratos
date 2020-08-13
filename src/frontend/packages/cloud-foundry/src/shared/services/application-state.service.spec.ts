import { TestBed } from '@angular/core/testing';

import { ApplicationStateService } from './application-state.service';


describe('ApplicationStateService', () => {

  const $translate = { instant: (label) => label };
  let cfAppStateService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [ApplicationStateService]
    }).compileComponents();
  });

  beforeEach(() => {
    cfAppStateService = TestBed.get(ApplicationStateService);
  });

  it('should be created', () => {
    expect(cfAppStateService).toBeTruthy();
  });

  describe('check friendly names and indicators', () => {

    function makeTestData(appState, packageState, instanceStates?) {
      const summary = {
        state: appState,
        package_state: packageState,
        package_updated_at: undefined,
        running_instances: 0,
        instances: instanceStates ? instanceStates.length : undefined
      };
      let instances = [];
      let running = 0;
      if (instanceStates) {
        instanceStates.forEach(s => {
          instances.push({ state: s });
          if (s === 'RUNNING') { running++; }
        });
      } else {
        instances = undefined;
      }
      summary.running_instances = running;
      return {
        summary,
        instances
      };
    }

    it('Busted push', () => {
      const testData = makeTestData('ANY', 'FAILED', ['RUNNING']);
      const res = cfAppStateService.get(testData.summary, testData.instances);

      expect(res.indicator).toBe('error');
      expect($translate.instant(res.label)).toBe('Staging Failed');
      expect(Object.keys(res.actions).length).toBe(2);
      expect(res.actions.delete).toBe(true);
    });

    it('Updating app', () => {
      const testData = makeTestData('STOPPED', 'PENDING', ['RUNNING', 'CRASHED']);
      testData.summary.package_updated_at = 'some date';
      const res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Offline while Updating');
      expect(Object.keys(res.actions).length).toBe(2);
      expect(res.actions.delete).toBe(true);
      expect(res.actions.start).toBe(true);
    });

    it('Incomplete app', () => {
      const testData = makeTestData('STOPPED', 'PENDING', ['RUNNING', 'CRASHED']);
      const res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('incomplete');
      expect($translate.instant(res.label)).toBe('Incomplete');
      expect(Object.keys(res.actions).length).toBe(3);
      expect(res.actions.delete).toBe(true);
      expect(res.actions.cli).toBe(true);
    });

    it('User stopped app', () => {
      const testData = makeTestData('STOPPED', 'STAGED', ['RUNNING', 'CRASHED']);
      const res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Offline');
      expect(Object.keys(res.actions).length).toBe(4);
      expect(res.actions.start).toBe(true);
      expect(res.actions.delete).toBe(true);
    });

    it('Incomplete', () => {
      const testData = makeTestData('STOPPED', undefined, ['RUNNING', 'CRASHED']);
      const res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('incomplete');
      expect($translate.instant(res.label)).toBe('Incomplete');
      expect(Object.keys(res.actions).length).toBe(3);
      expect(res.actions.delete).toBe(true);
      expect(res.actions.cli).toBe(true);
    });

    it('During push', () => {
      const testData = makeTestData('STARTED', 'PENDING', ['RUNNING', 'CRASHED']);
      const res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('busy');
      expect($translate.instant(res.label)).toBe('Staging App');
      expect(Object.keys(res.actions).length).toBe(1);
      expect(res.actions.delete).toBe(true);
    });

    it('After successful push', () => {
      const testData = makeTestData('STARTED', 'STAGED', ['STARTING']);
      const res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('busy');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Starting App');
      expect(Object.keys(res.actions).length).toBe(3);
      expect(res.actions.stop).toBe(true);
      expect(res.actions.restart).toBe(true);
    });

    it('Starting', () => {
      const testData = makeTestData('STARTED', 'STAGED', ['STARTING', 'RUNNING']);
      const res = cfAppStateService.get(testData.summary, testData.instances);

      expect(res.indicator).toBe('ok');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Scaling App');
      expect(Object.keys(res.actions).length).toBe(4);
      expect(res.actions.stop).toBe(true);
      expect(res.actions.restart).toBe(true);
    });

    it('Running!', () => {
      let testData = makeTestData('STARTED', 'STAGED', ['RUNNING']);
      let res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('ok');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Online');

      testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'RUNNING']);
      res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('ok');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Online');
      expect(Object.keys(res.actions).length).toBe(5);
      expect(res.actions.restart).toBe(true);
      expect(res.actions.stop).toBe(true);
      expect(res.actions.launch).toBe(true);
    });

    it('Borked, usually due to app code', () => {
      let testData = makeTestData('STARTED', 'STAGED', ['CRASHED']);
      let res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('error');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Crashed');

      testData = makeTestData('STARTED', 'STAGED', ['CRASHED', 'CRASHED']);
      res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('error');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Crashed');
      expect(Object.keys(res.actions).length).toBe(4);
      expect(res.actions.restart).toBe(true);
      expect(res.actions.stop).toBe(true);
    });

    it('Borked, usually due to starting timeouts', () => {
      let testData = makeTestData('STARTED', 'STAGED', ['TIMEOUT']);
      let res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Starting App');

      testData = makeTestData('STARTED', 'STAGED', ['TIMEOUT', 'TIMEOUT']);
      res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Starting App');
      expect(Object.keys(res.actions).length).toBe(3);
      expect(res.actions.restart).toBe(true);
      expect(res.actions.stop).toBe(true);
    });

    it('Borked, usually due to starting timeouts (1)', () => {
      let testData = makeTestData('STARTED', 'STAGED', ['TIMEOUT', 'CRASHED']);
      let res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('error');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Crashed');

      testData = makeTestData('STARTED', 'STAGED', ['TIMEOUT', 'TIMEOUT', 'CRASHED', 'CRASHED']);
      res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('error');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Crashed');
      expect(Object.keys(res.actions).length).toBe(4);
      expect(res.actions.restart).toBe(true);
      expect(res.actions.stop).toBe(true);
    });

    it('Borked, usually due to platform issues', () => {
      let testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'CRASHED']);
      let res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Crashing');

      testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'RUNNING', 'CRASHED', 'CRASHED']);
      res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Crashing');
      expect(Object.keys(res.actions).length).toBe(5);
      expect(res.actions.restart).toBe(true);
      expect(res.actions.stop).toBe(true);
      expect(res.actions.launch).toBe(true);
    });

    it('Borked, usually due to platform issues (2)', () => {
      let testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'UNKNOWN']);
      let res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Partially Online');

      testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'RUNNING', 'UNKNOWN', 'UNKNOWN']);
      res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Partially Online');
      expect(Object.keys(res.actions).length).toBe(5);
      expect(res.actions.restart).toBe(true);
      expect(res.actions.stop).toBe(true);
      expect(res.actions.launch).toBe(true);
    });

    it('Borked, one crashed, one running, one stating', () => {
      const testData = makeTestData('STARTED', 'STAGED', ['RUNNING', 'CRASHED', 'STARTING']);
      const res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('warning');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect($translate.instant(res.subLabel)).toBe('Crashing');
    });

    it('Started, but no stats available', () => {
      const testData = makeTestData('STARTED', 'STAGED');
      const res = cfAppStateService.get(testData.summary, undefined);
      expect(res.indicator).toBe('tentative');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect(res.subLabel).not.toBeDefined();
    });

    it('Started, but have instance counf set to 0', () => {
      const testData = makeTestData('STARTED', 'STAGED');
      const res = cfAppStateService.get(testData.summary, testData.instances);
      expect(res.indicator).toBe('tentative');
      expect($translate.instant(res.label)).toBe('Deployed');
      expect(res.subLabel).not.toBeDefined();
    });
  });
});
