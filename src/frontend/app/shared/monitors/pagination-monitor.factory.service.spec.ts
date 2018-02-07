import { TestBed, inject } from '@angular/core/testing';

import { PaginationMonitorFactory } from './pagination-monitor.factory.service';

describe('PaginationMonitorFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaginationMonitorFactory]
    });
  });

  it('should be created', inject([PaginationMonitorFactory], (service: PaginationMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
