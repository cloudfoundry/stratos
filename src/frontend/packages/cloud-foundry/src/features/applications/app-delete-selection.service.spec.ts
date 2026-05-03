import { describe, it, expect, beforeEach } from 'vitest';

import { AppDeleteSelectionService } from './app-delete-selection.service';

describe('AppDeleteSelectionService', () => {
  let svc: AppDeleteSelectionService;
  const TARGET = {
    appName: 'test-app',
    endpointName: 'cf-1',
    orgName: 'org-1',
    spaceName: 'space-1',
  } as any;

  beforeEach(() => {
    svc = new AppDeleteSelectionService();
  });

  it('starts empty and not requested', () => {
    expect(svc.routes()).toEqual([]);
    expect(svc.bindings()).toEqual([]);
    expect(svc.requested()).toBe(false);
    expect(svc.forAppGuid()).toBeNull();
    expect(svc.target()).toBeNull();
  });

  it('setPending stores the arrays and flips requested true', () => {
    svc.setPending(
      'app-1',
      TARGET,
      [{ guid: 'r-1' } as any],
      [{ guid: 'b-1' } as any, { guid: 'b-2' } as any],
    );
    expect(svc.routes()).toHaveLength(1);
    expect(svc.bindings()).toHaveLength(2);
    expect(svc.requested()).toBe(true);
    expect(svc.forAppGuid()).toBe('app-1');
    expect(svc.target()).toBe(TARGET);
  });

  it('clear empties everything and flips requested back to false', () => {
    svc.setPending('app-1', TARGET, [{ guid: 'r-1' } as any], [{ guid: 'b-1' } as any]);
    svc.clear();
    expect(svc.routes()).toEqual([]);
    expect(svc.bindings()).toEqual([]);
    expect(svc.requested()).toBe(false);
    expect(svc.forAppGuid()).toBeNull();
    expect(svc.target()).toBeNull();
  });

  it('setPending with empty arrays still flips requested true', () => {
    svc.setPending('app-1', TARGET, [], []);
    expect(svc.requested()).toBe(true);
    expect(svc.routes()).toEqual([]);
    expect(svc.bindings()).toEqual([]);
  });

  it('seed sets appGuid + target without flipping requested', () => {
    svc.seed('app-1', TARGET);
    expect(svc.forAppGuid()).toBe('app-1');
    expect(svc.target()).toBe(TARGET);
    expect(svc.requested()).toBe(false);
  });
});
