import { WritableSignal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { EndpointsDataService } from '../../../../store/src/services/endpoints-data.service';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { CloudFoundryService } from './cloud-foundry.service';

// The two CF endpoint sets deliberately diverge:
//   connectedCFEndpoints — connected-only, feeds request fan-out (a request to
//     an expired or mid-connect token would 401 / isn't usable yet).
//   availableCFEndpoints — connected + expired + connecting, feeds the picker
//     (an expired CF the user never disconnected is still theirs; a mid-connect
//     one should show). Excludes disconnected — the user dropped it.
describe('CloudFoundryService endpoint sets', () => {
  let list: WritableSignal<EndpointModel[]>;
  let connecting: Set<string>;
  let disconnecting: Set<string>;
  let service: CloudFoundryService;

  const ep = (guid: string, connectionStatus: string, cnsi_type = 'cf'): EndpointModel =>
    ({ guid, name: guid, cnsi_type, connectionStatus } as unknown as EndpointModel);

  beforeEach(() => {
    list = signal<EndpointModel[]>([]);
    connecting = new Set<string>();
    disconnecting = new Set<string>();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: EndpointsDataService,
          useValue: {
            endpointsList: list,
            isConnecting: (g: string) => connecting.has(g),
            isDisconnecting: (g: string) => disconnecting.has(g),
          },
        },
        CloudFoundryService,
      ],
    });
    service = TestBed.inject(CloudFoundryService);
  });

  it('connectedCFEndpoints is connected-only, CF-typed', () => {
    list.set([
      ep('a', 'connected'),
      ep('b', 'expired'),
      ep('c', 'disconnected'),
      ep('k', 'connected', 'metrics'),
    ]);

    expect(service.connectedCFEndpoints().map(e => e.guid)).toEqual(['a']);
  });

  it('availableCFEndpoints includes connected + expired, excludes disconnected and non-CF', () => {
    list.set([
      ep('a', 'connected'),
      ep('b', 'expired'),
      ep('c', 'disconnected'),
      ep('k', 'connected', 'metrics'),
    ]);

    expect(service.availableCFEndpoints().map(e => e.guid)).toEqual(['a', 'b']);
  });

  it('availableCFEndpoints includes a disconnected CF while it is mid-connect (connecting overlay)', () => {
    connecting.add('c');
    list.set([ep('a', 'connected'), ep('c', 'disconnected')]);

    // 'c' has a disconnected wire status but a connect is in flight, so the
    // overlay makes it 'connecting' — visible in the picker, but NOT in the
    // fan-out set (still no usable token).
    expect(service.availableCFEndpoints().map(e => e.guid)).toEqual(['a', 'c']);
    expect(service.connectedCFEndpoints().map(e => e.guid)).toEqual(['a']);
  });

  it('availableCFEndpoints keeps a CF visible while it is mid-disconnect (disconnecting overlay)', () => {
    disconnecting.add('a');
    list.set([ep('a', 'connected'), ep('b', 'connected')]);

    // 'a' is mid-disconnect: the picker keeps it visible (as Disconnecting)
    // until the operation settles. Fan-out still includes it — the token
    // remains valid until the DELETE lands, and the wire status only flips
    // once it does.
    expect(service.availableCFEndpoints().map(e => e.guid)).toEqual(['a', 'b']);
    expect(service.connectedCFEndpoints().map(e => e.guid)).toEqual(['a', 'b']);
  });
});
