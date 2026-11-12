import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { EndpointModel } from '@stratosui/store';
import { EndpointsSignalService } from '@stratosui/core';
import { CfOrgSpaceLabelService } from './cf-org-space-label.service';

function cf(guid: string, connectionStatus = 'connected'): EndpointModel {
  return { guid, name: guid === 'cf-1' ? 'My CF' : guid, cnsi_type: 'cf', connectionStatus } as EndpointModel;
}

function makeService(cfGuid?: string, connectedGuids: string[] = ['cf-1', 'cf-2']) {
  const all = signal<Record<string, EndpointModel>>({
    'cf-1': cf('cf-1', connectedGuids.includes('cf-1') ? 'connected' : 'disconnected'),
    ...Object.fromEntries(connectedGuids.filter(g => g !== 'cf-1').map(g => [g, cf(g)])),
  });
  const endpoints = { endpoints: all } as unknown as EndpointsSignalService;
  return { svc: new CfOrgSpaceLabelService(endpoints, cfGuid), all };
}

describe('CfOrgSpaceLabelService (signal-native)', () => {
  it('getCfName resolves the endpoint name from the signal source (no ngrx Store)', async () => {
    const { svc } = makeService('cf-1');
    expect(await firstValueFrom(svc.getCfName())).toBe('My CF');
  });

  it('getCfName is empty when the endpoint guid is unknown', async () => {
    const { svc } = makeService('missing');
    expect(await firstValueFrom(svc.getCfName())).toBe('');
  });

  it('getOrgName/getSpaceName are empty on the live breadcrumb path (no org/space guid)', async () => {
    const { svc } = makeService('cf-1');
    expect(await firstValueFrom(svc.getOrgName())).toBe('');
    expect(await firstValueFrom(svc.getSpaceName())).toBe('');
  });

  it('multipleConnectedEndpoints is true when more than one CF is connected', () => {
    const { svc } = makeService('cf-1', ['cf-1', 'cf-2']);
    expect(svc.multipleConnectedEndpoints()).toBe(true);
  });

  it('multipleConnectedEndpoints is false with a single connected CF', () => {
    const { svc } = makeService('cf-1', ['cf-1']);
    expect(svc.multipleConnectedEndpoints()).toBe(false);
  });

  it('multipleConnectedEndpoints follows a CF connected later', () => {
    const { svc, all } = makeService('cf-1', ['cf-1']);
    expect(svc.multipleConnectedEndpoints()).toBe(false);
    all.update(e => ({ ...e, 'cf-2': cf('cf-2') }));
    expect(svc.multipleConnectedEndpoints()).toBe(true);
  });

  it('multipleConnectedEndpoints ignores endpoints that are not connected CFs', () => {
    const { svc, all } = makeService('cf-1', ['cf-1']);
    all.update(e => ({
      ...e,
      'cf-2': cf('cf-2', 'disconnected'),
      'k8s-1': { guid: 'k8s-1', cnsi_type: 'k8s', connectionStatus: 'connected' } as EndpointModel,
    }));
    expect(svc.multipleConnectedEndpoints()).toBe(false);
  });

  it('exposes the same routing URLs as the legacy service', () => {
    const { svc } = makeService('cf-1');
    expect(svc.getCfURL()).toEqual(['/cloud-foundry', 'cf-1', 'summary']);
  });
});
