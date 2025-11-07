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
});
