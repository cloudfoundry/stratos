import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CurrentUserPermissionsService } from '@stratosui/core';
import { GitSCMService } from '@stratosui/git';
import { EndpointsDataService } from '@stratosui/store';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getFeatureFlagsSource } from '../../../user-permissions/feature-flags-cache';
import { ApplicationDeploySourceTypes, DEPLOY_TYPES_IDS } from './deploy-application-steps.types';

describe('ApplicationDeploySourceTypes.canDeployType', () => {
  const canDocker = signal(false);
  let types: ApplicationDeploySourceTypes;

  beforeEach(() => {
    canDocker.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ApplicationDeploySourceTypes,
        { provide: CurrentUserPermissionsService, useValue: { can: vi.fn(() => canDocker) } },
        { provide: GitSCMService, useValue: { getSCM: () => ({}) } },
        { provide: EndpointsDataService, useValue: { endpointsList: signal([]) } },
      ],
    });
    types = TestBed.inject(ApplicationDeploySourceTypes);
  });

  it('answers docker only once the flags have loaded', async () => {
    const src = getFeatureFlagsSource('docker-cf', TestBed.inject(HttpClient));
    let finishLoad!: () => void;
    vi.spyOn(src, 'load').mockReturnValue(new Promise<void>(resolve => finishLoad = resolve));

    const seen: boolean[] = [];
    const sub = types.canDeployType('docker-cf', DEPLOY_TYPES_IDS.DOCKER_IMG).subscribe(v => seen.push(v));
    await Promise.resolve();
    expect(seen).toEqual([]);

    // The flags land with the flag on.
    canDocker.set(true);
    finishLoad();
    await Promise.resolve();
    await Promise.resolve();
    expect(seen).toEqual([true]);
    sub.unsubscribe();
  });

  it('allows other source types straight away', async () => {
    expect(await firstValueFrom(types.canDeployType('any-cf', DEPLOY_TYPES_IDS.GITHUB))).toBe(true);
  });
});
