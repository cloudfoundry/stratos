import { computed, Injector, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AutoscalerInfoDataService } from '../../services/domain-data/autoscaler-info-data.service';
import { fetchAutoscalerInfo, isAutoscalerEnabled, setAutoscalerHelperInjector } from './autoscaler-available';

// The helpers run off the root injector captured by the package module, so
// whatever watches the data service signals must end with the subscription,
// not with the (permanent) root injector.
describe('autoscaler-available helpers', () => {
  // Each data service signal is read through a computed that counts its
  // evaluations, so a still-running watcher shows up as extra reads after a
  // write to the backing signal.
  let available: ReturnType<typeof signal<boolean>>;
  let info: ReturnType<typeof signal<unknown>>;
  let reads: number;

  beforeEach(() => {
    available = signal(false);
    info = signal<unknown>(null);
    reads = 0;
    const counted = <T>(read: () => T) => computed(() => {
      reads++;
      return read();
    });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AutoscalerInfoDataService,
          useValue: {
            load: vi.fn().mockResolvedValue(undefined),
            isAvailable: () => counted(() => available()),
            info: () => counted(() => info()),
            error: () => computed(() => null),
            loading: () => computed(() => false),
          },
        },
      ],
    });
    setAutoscalerHelperInjector(TestBed.inject(Injector));
  });

  describe('isAutoscalerEnabled', () => {
    it('does not read the availability signal until subscribed', () => {
      isAutoscalerEnabled('ep-1');
      TestBed.tick();
      available.set(true);
      TestBed.tick();

      expect(reads).toBe(0);
    });

    it('stops reading the availability signal after unsubscribe', () => {
      const values: boolean[] = [];
      const sub = isAutoscalerEnabled('ep-1').subscribe(v => values.push(v));
      TestBed.tick();
      available.set(true);
      TestBed.tick();
      // startWith(false) sits after distinctUntilChanged, so the seed and the
      // first signal value both come through.
      expect(values).toEqual([false, false, true]);
      const readsWhileSubscribed = reads;

      sub.unsubscribe();
      available.set(false);
      TestBed.tick();

      expect(reads).toBe(readsWhileSubscribed);
      expect(values).toEqual([false, false, true]);
    });
  });

  describe('fetchAutoscalerInfo', () => {
    it('stops reading the info signal after unsubscribe', () => {
      const builds: unknown[] = [];
      const sub = fetchAutoscalerInfo('ep-1').subscribe(v => builds.push(v.entity?.entity));
      TestBed.tick();
      info.set({ build: '1' });
      TestBed.tick();
      expect(builds).toEqual([undefined, { build: '1' }]);
      const readsWhileSubscribed = reads;

      sub.unsubscribe();
      info.set({ build: '2' });
      TestBed.tick();

      expect(reads).toBe(readsWhileSubscribed);
      expect(builds).toEqual([undefined, { build: '1' }]);
    });
  });
});
