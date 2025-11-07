import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { StoreModule } from '@ngrx/store';
import { provideZonelessChangeDetection } from '@angular/core';

import { InternalEventMonitorFactory } from './internal-event-monitor.factory';


describe('InternalEventMonitorFactory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InternalEventMonitorFactory,
        provideZonelessChangeDetection(),
      ],
      imports: [
        StoreModule.forRoot({}),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(InternalEventMonitorFactory);
    expect(service).toBeTruthy();
  });
});
