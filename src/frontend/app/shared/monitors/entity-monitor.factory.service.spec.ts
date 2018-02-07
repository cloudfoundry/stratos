import { TestBed, inject } from '@angular/core/testing';

import { EntityMonitorFactory } from './entity-monitor.factory.service';

describe('EntityMonitor.FactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityMonitorFactory]
    });
  });

  it('should be created', inject([EntityMonitorFactory], (service: EntityMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
