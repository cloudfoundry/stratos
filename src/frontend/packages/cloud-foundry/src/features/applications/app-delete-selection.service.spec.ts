import { describe, it, expect, beforeEach } from 'vitest';

import { AppDeleteSelectionService } from './app-delete-selection.service';

describe('AppDeleteSelectionService', () => {
  let svc: AppDeleteSelectionService;

  beforeEach(() => {
    svc = new AppDeleteSelectionService();
  });

  it('starts empty and not requested', () => {
    expect(svc.routes()).toEqual([]);
    expect(svc.bindings()).toEqual([]);
    expect(svc.requested()).toBe(false);
  });

  it('setPending stores the arrays and flips requested true', () => {
    svc.setPending(
      [{ guid: 'r-1' } as any],
      [{ guid: 'b-1' } as any, { guid: 'b-2' } as any],
    );
    expect(svc.routes()).toHaveLength(1);
    expect(svc.bindings()).toHaveLength(2);
    expect(svc.requested()).toBe(true);
  });

  it('clear empties everything and flips requested back to false', () => {
    svc.setPending([{ guid: 'r-1' } as any], [{ guid: 'b-1' } as any]);
    svc.clear();
    expect(svc.routes()).toEqual([]);
    expect(svc.bindings()).toEqual([]);
    expect(svc.requested()).toBe(false);
  });

  it('setPending with empty arrays still flips requested true', () => {
    svc.setPending([], []);
    expect(svc.requested()).toBe(true);
    expect(svc.routes()).toEqual([]);
    expect(svc.bindings()).toEqual([]);
  });
});
