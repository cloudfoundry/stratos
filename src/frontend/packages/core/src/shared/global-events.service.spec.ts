import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, CoreTestingModule } from '@test-framework';
import { CoreModule } from '../core/core.module';
import { GlobalEventService } from './global-events.service';
import { SharedModule } from './shared.module';


describe('GlobalEventsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      ...STORE_TEST_PROVIDERS,
      provideZonelessChangeDetection()
    ],
    imports: [
      CoreModule,
      SharedModule,
      CoreTestingModule,
      createBasicStoreModule(),
    ]
  }));

  it('should be created', () => {
    const service: GlobalEventService = TestBed.inject(GlobalEventService);
    expect(service).toBeTruthy();
  });

  describe('events$ across page changes', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    // Pages subscribe to events$ (the page-header banner, the events page)
    // and unsubscribe when the user navigates away, so the subscriber count
    // regularly drops to zero. The next page must get the current events at
    // once, not after the event stream's 100 ms debounce.
    it('replays the latest events to a subscriber that arrives after all others left', () => {
      vi.useFakeTimers();
      const service = TestBed.inject(GlobalEventService);

      let emissions = 0;
      const first = service.events$.subscribe(() => emissions++);
      TestBed.tick();
      vi.advanceTimersByTime(100);
      expect(emissions).toBeGreaterThan(0);
      first.unsubscribe();

      emissions = 0;
      const second = service.events$.subscribe(() => emissions++);
      expect(emissions).toBe(1);
      second.unsubscribe();
    });
  });
});
