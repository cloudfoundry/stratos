import { TestBed, inject } from '@angular/core/testing';

import { MetricsRangeSelectorService } from './metrics-range-selector.service';

describe('MetricsRangeSelectorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MetricsRangeSelectorService]
    });
  });

  it('should be created', inject([MetricsRangeSelectorService], (service: MetricsRangeSelectorService) => {
    expect(service).toBeTruthy();
  }));
});
