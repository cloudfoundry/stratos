import { TestBed, inject } from '@angular/core/testing';
import { InternalEventMonitorFactory } from './internal-event-monitor.factory';


describe('InternalEventMonitorFactory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InternalEventMonitorFactory]
    });
  });

  it('should be created', inject([InternalEventMonitorFactory], (service: InternalEventMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
