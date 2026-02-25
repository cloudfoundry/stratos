import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { MetricsRangeSelectorManagerService } from './metrics-range-selector-manager.service';
import { MetricsRangeSelectorService } from './metrics-range-selector.service';

describe('MetricsRangeSelectorManagerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        MetricsRangeSelectorManagerService,
        MetricsRangeSelectorService,
        provideZonelessChangeDetection(),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(MetricsRangeSelectorManagerService);
    expect(service).toBeTruthy();
  });
});
