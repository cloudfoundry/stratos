import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import type { EndpointModel } from '@stratosui/store';

import { EndpointsSignalService } from './endpoints-signal.service';
import { EndpointDataRegistry } from '../../../../cloud-foundry/src/services/endpoint-data/endpoint-data.registry';
import { FreshEntityNameService } from './fresh-entity-name.service';

// Minimal per-endpoint data stub: only the three list signals the resolver reads.
function makeEndpointDataStub() {
  const apps: WritableSignal<{ guid: string; name: string }[]> = signal([]);
  const orgs: WritableSignal<{ guid: string; name: string }[]> = signal([]);
  const spaces: WritableSignal<{ guid: string; name: string }[]> = signal([]);
  return { apps, orgs, spaces };
}

describe('FreshEntityNameService', () => {
  let endpointData: ReturnType<typeof makeEndpointDataStub>;
  let registryStub: { peek: (guid: string) => unknown };
  let endpointsSig: WritableSignal<Record<string, EndpointModel>>;
  let service: FreshEntityNameService;

  beforeEach(() => {
    endpointData = makeEndpointDataStub();
    registryStub = { peek: (guid: string) => (guid === 'ep1' ? endpointData : undefined) };
    endpointsSig = signal<Record<string, EndpointModel>>({});

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointDataRegistry, useValue: registryStub },
        { provide: EndpointsSignalService, useValue: { endpoints: endpointsSig } },
        FreshEntityNameService,
      ],
    });
    service = TestBed.inject(FreshEntityNameService);
  });

  it('returns null when the endpoint has not been loaded (peek miss)', () => {
    expect(service.freshNameFor({ endpointType: 'cf', entityType: 'application', endpointId: 'nope', entityId: 'a1' })).toBeNull();
  });

  it('resolves a fresh application name by guid', () => {
    endpointData.apps.set([{ guid: 'a1', name: 'fresh app' }]);
    expect(service.freshNameFor({ endpointType: 'cf', entityType: 'application', endpointId: 'ep1', entityId: 'a1' })).toBe('fresh app');
  });

  it('resolves org and space names by guid', () => {
    endpointData.orgs.set([{ guid: 'o1', name: 'fresh org' }]);
    endpointData.spaces.set([{ guid: 's1', name: 'fresh space' }]);
    expect(service.freshNameFor({ endpointType: 'cf', entityType: 'organization', endpointId: 'ep1', entityId: 'o1' })).toBe('fresh org');
    expect(service.freshNameFor({ endpointType: 'cf', entityType: 'space', endpointId: 'ep1', entityId: 's1' })).toBe('fresh space');
  });

  it('returns null when the entity is absent from the fresh list (deleted)', () => {
    endpointData.apps.set([{ guid: 'other', name: 'x' }]);
    expect(service.freshNameFor({ endpointType: 'cf', entityType: 'application', endpointId: 'ep1', entityId: 'a1' })).toBeNull();
  });

  it('resolves a fresh endpoint name from the endpoints signal', () => {
    endpointsSig.set({ ep1: { guid: 'ep1', name: 'fresh endpoint' } as unknown as EndpointModel });
    expect(service.freshNameFor({ endpointType: 'cf', entityType: 'endpoint', endpointId: 'ep1', entityId: null })).toBe('fresh endpoint');
  });

  it('returns null for an unknown endpoint favorite', () => {
    expect(service.freshNameFor({ endpointType: 'cf', entityType: 'endpoint', endpointId: 'ghost', entityId: null })).toBeNull();
  });

  it('returns null for an unsupported entity type', () => {
    expect(service.freshNameFor({ endpointType: 'cf', entityType: 'route', endpointId: 'ep1', entityId: 'r1' })).toBeNull();
  });
});
