import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
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

  describe('events', () => {
    const warning = { key: 'ignored', message: 'Polling is off', link: '', type: 'warning' as const };

    it('lists a static event at once, marked unread', () => {
      const service = TestBed.inject(GlobalEventService);
      service.setStaticEvent('polling', warning);
      expect(service.events()).toEqual([expect.objectContaining({ key: 'polling', read: false })]);
    });

    it('marks an event read, and forgets the mark once the event has gone', () => {
      const service = TestBed.inject(GlobalEventService);
      service.setStaticEvent('polling', warning);
      service.updateEventReadState(service.events()[0], true);
      expect(service.events()[0].read).toBe(true);

      service.setStaticEvent('polling', null);
      TestBed.tick();
      expect(service.readEvents().has('polling')).toBe(false);

      service.setStaticEvent('polling', warning);
      expect(service.events()[0].read).toBe(false);
    });
  });
});
