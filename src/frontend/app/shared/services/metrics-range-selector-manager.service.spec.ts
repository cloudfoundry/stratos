import { TestBed, inject } from '@angular/core/testing';

import { MetricsRangeSelectorManagerService } from './metrics-range-selector-manager.service';

describe('MetricsRangeSelectorManagerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MetricsRangeSelectorManagerService]
    });
  });

  it('should be created', inject([MetricsRangeSelectorManagerService], (service: MetricsRangeSelectorManagerService) => {
    expect(service).toBeTruthy();
  }));
});
