import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { CfAppsSignalConfigService } from '../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { goToAppWall, goToCfApplications } from './cf.helpers';

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

// goToCfApplications is the CF-scoped sibling: same filter-signal writes, but
// it navigates to the per-CF applications tab (/cloud-foundry/<cf>/applications)
// instead of the global cross-CF wall. CF-scoped context must stay CF-scoped —
// the org summary's Applications count links here, NOT to /applications.
describe('goToCfApplications', () => {
  const makeConfig = () => ({
    selectedCnsi: signal<string | null>(null),
    selectedOrg: signal<string | null>(null),
    selectedSpace: signal<string | null>(null),
  }) as unknown as CfAppsSignalConfigService;

  it('sets cf/org/space selections and navigates to the CF-scoped apps tab', () => {
    const appsConfig = makeConfig();
    const router = { navigate: vi.fn() } as unknown as Router;

    goToCfApplications(appsConfig, router, 'cf-1', 'org-1');

    expect(appsConfig.selectedCnsi()).toBe('cf-1');
    expect(appsConfig.selectedOrg()).toBe('org-1');
    // Stays in the CF scope — never the global /applications wall.
    expect(router.navigate).toHaveBeenCalledWith(['/cloud-foundry', 'cf-1', 'applications']);
    expect(router.navigate).not.toHaveBeenCalledWith(['applications']);
  });
});
