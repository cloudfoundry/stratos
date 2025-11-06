import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule } from "../test-framework/core-test.helper";

import { CoreTestingModule } from '../../test-framework/core-test.modules';
import { CoreModule } from '../core/core.module';
import { GlobalEventService } from './global-events.service';
import { SharedModule } from './shared.module';


describe('GlobalEventsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
    imports: [
      CoreModule,
      SharedModule,
      CoreTestingModule,
      createBasicStoreModule()
    ]
  }));

  it('should be created', () => {
    const service: GlobalEventService = TestBed.inject(GlobalEventService);
    expect(service).toBeTruthy();
  });
});
