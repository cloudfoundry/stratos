import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { CurrentUserRolesDataService, EndpointModel, EndpointsDataService } from '@stratosui/store';

import { SessionSignalService } from '../../core/signals/session-signal.service';
import { canEditEndpointGuard } from './endpoint-permissions.service';
import { ENDPOINTS_ROUTES } from './endpoints.routes';

const SYSTEM_ENDPOINT = {
  guid: 'ep-1', name: 'cf', cnsi_type: 'cf', creator: { name: 'System Endpoint', admin: false, system: true },
} as unknown as EndpointModel;

describe('canEditEndpointGuard', () => {
  const signIn = (admin: boolean) =>
    TestBed.inject(CurrentUserRolesDataService).applySessionScopes({ admin, guid: 'me-guid', name: 'me', scopes: [] });

  const run = async (id: string) => {
    const route = { paramMap: convertToParamMap({ id }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => canEditEndpointGuard(route, {} as RouterStateSnapshot));
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: EndpointsDataService,
          useValue: {
            whenReady: () => Promise.resolve(),
            endpoints: signal(new Map([['ep-1', SYSTEM_ENDPOINT]])),
          },
        },
        {
          provide: SessionSignalService,
          useValue: {
            sessionData: signal({ user: { name: 'me' } }),
            userEndpointsEnabled: signal(false),
            userEndpointsNotDisabled: signal(false),
          },
        },
      ],
    });
  });

  it('guards the Edit Endpoint route', () => {
    const edit = ENDPOINTS_ROUTES.find(r => r.path === 'edit/:id');
    expect(edit?.canActivate ?? []).toContain(canEditEndpointGuard);
  });

  it('lets a Stratos admin edit an endpoint', async () => {
    signIn(true);
    expect(await run('ep-1')).toBe(true);
  });

  it('sends a user who may not edit back to the endpoints list', async () => {
    signIn(false);
    const result = await run('ep-1');
    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/endpoints');
  });

  it('sends an unknown endpoint back to the endpoints list', async () => {
    signIn(true);
    expect((await run('missing')) instanceof UrlTree).toBe(true);
  });
});
