import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { EndpointModel } from '@stratosui/store';

import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { CfEndpointsDataService } from './cf-endpoints-data.service';

const ENDPOINT_KEY = 'stratosEndpoint';

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

function stateWith(endpoints: Record<string, EndpointModel>): unknown {
  return {
    requestData: {
      [ENDPOINT_KEY]: endpoints,
    },
  };
}

describe('CfEndpointsDataService', () => {
  let svc: CfEndpointsDataService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: stateWith({}) }),
        CfEndpointsDataService,
      ],
    });
    store = TestBed.inject(MockStore);
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
    store.setState(stateWith({ 'cf-a': cfA, 'cf-b': cfB, 'k8s-a': k8sA }));

    expect(Object.keys(svc.all()).sort()).toEqual(['cf-a', 'cf-b', 'k8s-a']);
    expect(Object.keys(svc.connected()).sort()).toEqual(['cf-a', 'k8s-a']);
    expect(Object.keys(svc.connectedCf())).toEqual(['cf-a']);
    expect(svc.connectedCfList().map(e => e.guid)).toEqual(['cf-a']);
    expect(svc.hasConnectedCf()).toBe(true);
  });

  it('filters out non-cf and non-connected endpoints from connectedCf', () => {
    store.setState(stateWith({ 'cf-b': cfB, 'k8s-a': k8sA }));

    expect(Object.keys(svc.connectedCf())).toEqual([]);
    expect(svc.hasConnectedCf()).toBe(false);
  });
});
