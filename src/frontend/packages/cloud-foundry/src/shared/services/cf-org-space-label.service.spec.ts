import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { firstValueFrom, of } from 'rxjs';

import { EndpointModel } from '@stratosui/store';
import { EndpointsSignalService } from '@stratosui/core';
import { CfCurrentUserRolesSignalService } from '../../user-permissions/cf-current-user-roles-signal.service';
import { CfOrgSpaceLabelService } from './cf-org-space-label.service';

function makeService(cfGuid?: string, connectedGuids: string[] = ['cf-1', 'cf-2']) {
  const endpoints = {
    endpoints: signal<Record<string, EndpointModel>>({
      'cf-1': { guid: 'cf-1', name: 'My CF' } as EndpointModel,
    }),
  } as unknown as EndpointsSignalService;
  const cfRoles = {
    connectedCfEndpointGuids$: () => of(connectedGuids),
  } as unknown as CfCurrentUserRolesSignalService;
  return new CfOrgSpaceLabelService(endpoints, cfRoles, cfGuid);
}

describe('CfOrgSpaceLabelService (signal-native)', () => {
  it('getCfName resolves the endpoint name from the signal source (no ngrx Store)', async () => {
    const svc = makeService('cf-1');
    expect(await firstValueFrom(svc.getCfName())).toBe('My CF');
  });

  it('getCfName is empty when the endpoint guid is unknown', async () => {
    const svc = makeService('missing');
    expect(await firstValueFrom(svc.getCfName())).toBe('');
  });

  it('getOrgName/getSpaceName are empty on the live breadcrumb path (no org/space guid)', async () => {
    const svc = makeService('cf-1');
    expect(await firstValueFrom(svc.getOrgName())).toBe('');
    expect(await firstValueFrom(svc.getSpaceName())).toBe('');
  });

  it('multipleConnectedEndpoints$ is true when more than one CF is connected', async () => {
    const svc = makeService('cf-1', ['cf-1', 'cf-2']);
    expect(await firstValueFrom(svc.multipleConnectedEndpoints$)).toBe(true);
  });

  it('multipleConnectedEndpoints$ is false with a single connected CF', async () => {
    const svc = makeService('cf-1', ['cf-1']);
    expect(await firstValueFrom(svc.multipleConnectedEndpoints$)).toBe(false);
  });

  it('exposes the same routing URLs as the legacy service', () => {
    const svc = makeService('cf-1');
    expect(svc.getCfURL()).toEqual(['/cloud-foundry', 'cf-1', 'summary']);
  });
});
