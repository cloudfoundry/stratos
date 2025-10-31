import { TestBed, inject } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MetricsRangeSelectorManagerService } from './metrics-range-selector-manager.service';
import { MetricsRangeSelectorService } from './metrics-range-selector.service';

describe('MetricsRangeSelectorManagerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MetricsRangeSelectorManagerService,
        MetricsRangeSelectorService
      ],
    });
  });

  it('should be created', inject([MetricsRangeSelectorManagerService], (service: MetricsRangeSelectorManagerService) => {
    expect(service).toBeTruthy();
  }));
});
