import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { CfAppsSignalConfigService } from '../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { goToAppWall } from './cf.helpers';

// goToAppWall scopes the signal-native application wall by writing the
// CfAppsSignalConfigService toolbar selections (cnsi/org/space) — the root
// singleton the wall reads its filter from — then navigates to the canonical
// /applications route. Replaces the removed ngrx SetClientFilter dispatch +
// selectPaginationState wait (which the signal wall never consumed).
describe('goToAppWall', () => {
  const makeConfig = () => ({
    selectedCnsi: signal<string | null>(null),
    selectedOrg: signal<string | null>(null),
    selectedSpace: signal<string | null>(null),
  }) as unknown as CfAppsSignalConfigService;

  it('sets cf/org/space selections and navigates to the app wall', () => {
    const appsConfig = makeConfig();
    const router = { navigate: vi.fn() } as unknown as Router;

    goToAppWall(appsConfig, router, 'cf-1', 'org-1', 'space-1');

    expect(appsConfig.selectedCnsi()).toBe('cf-1');
    expect(appsConfig.selectedOrg()).toBe('org-1');
    expect(appsConfig.selectedSpace()).toBe('space-1');
    expect(router.navigate).toHaveBeenCalledWith(['applications']);
  });

  it('clears org/space when only a cf guid is given', () => {
    const appsConfig = makeConfig();
    // Seed stale selections to prove they are reset, not left dangling.
    appsConfig.selectedOrg.set('stale-org');
    appsConfig.selectedSpace.set('stale-space');
    const router = { navigate: vi.fn() } as unknown as Router;

    goToAppWall(appsConfig, router, 'cf-1');

    expect(appsConfig.selectedCnsi()).toBe('cf-1');
    expect(appsConfig.selectedOrg()).toBeNull();
    expect(appsConfig.selectedSpace()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['applications']);
  });
});
