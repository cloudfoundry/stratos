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

describe('ApplicationDeploySourceTypes.types', () => {
  const endpoints = signal<any[]>([]);
  const scm = (type: string, api: string) => ({ getType: () => type, getPublicApi: () => api });
  const gitEndpoint = (guid: string, name: string, sub_type: string, host: string) => ({
    guid, name, cnsi_type: 'git', sub_type, api_endpoint: { Scheme: 'https', Host: host, Path: '' },
  });

  beforeEach(() => {
    endpoints.set([]);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ApplicationDeploySourceTypes,
        { provide: CurrentUserPermissionsService, useValue: { can: vi.fn() } },
        {
          provide: GitSCMService,
          useValue: {
            getSCM: (type: string) => type === 'github' ? scm('github', 'https://api.github.com') : scm('gitlab', 'https://gitlab.com'),
          },
        },
        { provide: EndpointsDataService, useValue: { endpointsList: endpoints } },
      ],
    });
  });

  it('follows the registered git endpoints', () => {
    const types = TestBed.inject(ApplicationDeploySourceTypes);
    const ids = () => types.types().map(t => `${t.id}:${t.endpointGuid ?? ''}`);
    expect(ids()).toEqual(['github:', 'gitlab:', 'giturl:', 'dockerimg:', 'file:', 'folder:']);

    endpoints.set([
      gitEndpoint('gh', 'GitHub', 'github', 'api.github.com'),
      gitEndpoint('ghe', 'Acme GHE', 'github', 'ghe.acme.test'),
    ]);

    // The github.com endpoint is attached to the base type; the enterprise one is added after it
    expect(ids()).toEqual(['github:gh', 'github:ghe', 'gitlab:', 'giturl:', 'dockerimg:', 'file:', 'folder:']);
    expect(types.types()[1].name).toBe('Acme GHE');
  });

  it('finds the type picked in the link by id and endpoint', () => {
    endpoints.set([gitEndpoint('ghe', 'Acme GHE', 'github', 'ghe.acme.test')]);
    const types = TestBed.inject(ApplicationDeploySourceTypes);
    const route = (queryParams: Record<string, string>) => ({ snapshot: { queryParams } }) as any;

    expect(types.getAutoSelectedType(route({}))).toBeUndefined();
    expect(types.getAutoSelectedType(route({ 'auto-select-deploy': 'github', 'auto-select-deploy-endpoint': 'ghe' }))?.name).toBe('Acme GHE');
  });
});
