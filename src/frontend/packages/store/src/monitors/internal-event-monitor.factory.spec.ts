import { inject, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { StoreModule } from '@ngrx/store';

import { InternalEventMonitorFactory } from './internal-event-monitor.factory';


describe('InternalEventMonitorFactory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InternalEventMonitorFactory],
      imports: [
        StoreModule.forRoot({})
      ]
    });
  });

  it('should be created', inject([InternalEventMonitorFactory], (service: InternalEventMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
