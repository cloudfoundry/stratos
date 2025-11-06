import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { MetricsRangeSelectorService } from './metrics-range-selector.service';

describe('MetricsRangeSelectorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MetricsRangeSelectorService]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(MetricsRangeSelectorService);
    expect(service).toBeTruthy();
  });
});
