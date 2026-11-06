import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { EndpointModel, EndpointsDataService } from '@stratosui/store';

import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { CfEndpointsDataService } from './cf-endpoints-data.service';

const cfA = {
  guid: 'cf-a',
  name: 'CF A',
  cnsi_type: CF_ENDPOINT_TYPE,
  connectionStatus: 'connected',
} as unknown as EndpointModel;

const cfB = {
  guid: 'cf-b',
  name: 'CF B',
  cnsi_type: CF_ENDPOINT_TYPE,
  connectionStatus: 'disconnected',
} as unknown as EndpointModel;

const k8sA = {
  guid: 'k8s-a',
  name: 'K8S A',
  cnsi_type: 'k8s',
  connectionStatus: 'connected',
} as unknown as EndpointModel;

function makeEndpointsServiceStub() {
  const map: WritableSignal<Map<string, EndpointModel>> = signal(new Map());
  return {
    endpoints: map,
    set: (entries: Record<string, EndpointModel>) => map.set(new Map(Object.entries(entries))),
  };
}

describe('CfEndpointsDataService', () => {
  let svc: CfEndpointsDataService;
  let endpointsServiceStub: ReturnType<typeof makeEndpointsServiceStub>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    endpointsServiceStub = makeEndpointsServiceStub();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointsDataService, useValue: endpointsServiceStub },
        CfEndpointsDataService,
      ],
    });
    svc = TestBed.inject(CfEndpointsDataService);
  });

  it('starts with empty signals when no endpoints registered', () => {
    expect(Object.keys(svc.all())).toHaveLength(0);
    expect(Object.keys(svc.connected())).toHaveLength(0);
    expect(Object.keys(svc.connectedCf())).toHaveLength(0);
    expect(svc.connectedCfList()).toEqual([]);
    expect(svc.hasConnectedCf()).toBe(false);
  });

  it('exposes endpoint entities, connected endpoints and connectedCf via signals', () => {
    endpointsServiceStub.set({ 'cf-a': cfA, 'cf-b': cfB, 'k8s-a': k8sA });

    expect(Object.keys(svc.all()).sort()).toEqual(['cf-a', 'cf-b', 'k8s-a']);
    expect(Object.keys(svc.connected()).sort()).toEqual(['cf-a', 'k8s-a']);
    expect(Object.keys(svc.connectedCf())).toEqual(['cf-a']);
    expect(svc.connectedCfList().map(e => e.guid)).toEqual(['cf-a']);
    expect(svc.hasConnectedCf()).toBe(true);
  });

  it('filters out non-cf and non-connected endpoints from connectedCf', () => {
    endpointsServiceStub.set({ 'cf-b': cfB, 'k8s-a': k8sA });

    expect(Object.keys(svc.connectedCf())).toEqual([]);
    expect(svc.hasConnectedCf()).toBe(false);
  });
});
