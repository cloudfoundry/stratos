import { TestBed, inject } from '@angular/core/testing';

import { InternalEventMonitor } from './internal-event.monitor';

describe('InternalEventMonitor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InternalEventMonitor]
    });
  });

  it('should be created', inject([InternalEventMonitor], (service: InternalEventMonitor) => {
    expect(service).toBeTruthy();
  }));
});
