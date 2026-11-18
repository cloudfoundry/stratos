import { TestBed } from '@angular/core/testing';
import { EndpointConnectEvent, EndpointDisconnectCleanupService } from '@stratosui/store';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EndpointAuthStateService } from './endpoint-auth-state.service';

// A banner ref with the two members trackBanner uses.
function bannerRef() {
  const dismissed = new Subject<void>();
  return {
    dismiss: vi.fn(() => dismissed.next()),
    afterDismissed: () => dismissed.asObservable(),
    userDismiss: () => dismissed.next(),
  };
}

describe('EndpointAuthStateService', () => {
  let connectHandlers: Array<(e: EndpointConnectEvent) => void>;
  let service: EndpointAuthStateService;

  beforeEach(() => {
    connectHandlers = [];
    TestBed.configureTestingModule({
      providers: [{
        provide: EndpointDisconnectCleanupService,
        useValue: { registerConnectHandler: (h: (e: EndpointConnectEvent) => void) => connectHandlers.push(h) },
      }],
    });
    service = TestBed.inject(EndpointAuthStateService);
  });

  it('clearStale closes a banner raised for that endpoint', () => {
    const ref = bannerRef();
    service.markStale('g1');
    service.trackBanner(['g1'], ref);

    service.clearStale('g1');

    expect(ref.dismiss).toHaveBeenCalledTimes(1);
  });

  it('a banner for several endpoints closes once all of them have cleared', () => {
    const ref = bannerRef();
    service.trackBanner(['g1', 'g2'], ref);

    service.clearStale('g1');
    expect(ref.dismiss).not.toHaveBeenCalled();

    service.clearStale('g2');
    expect(ref.dismiss).toHaveBeenCalledTimes(1);
  });

  it('a banner the user dismissed is not closed again', () => {
    const ref = bannerRef();
    service.trackBanner(['g1'], ref);
    ref.userDismiss();

    service.clearStale('g1');

    expect(ref.dismiss).not.toHaveBeenCalled();
  });

  it('a successful connect clears the stale mark and closes its banners', () => {
    const ref = bannerRef();
    service.markStale('g1');
    service.trackBanner(['g1'], ref);

    connectHandlers.forEach(h => h({ guid: 'g1', type: 'cf', name: 'cf1', user: undefined }));

    expect(service.isStale('g1')).toBe(false);
    expect(ref.dismiss).toHaveBeenCalledTimes(1);
  });
});
