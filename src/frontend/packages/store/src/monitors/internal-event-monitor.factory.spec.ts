import { TestBed, inject } from '@angular/core/testing';
import { InternalEventMonitorFactory } from './internal-event-monitor.factory';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { StoreModule } from '@ngrx/store';


describe('InternalEventMonitorFactory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InternalEventMonitorFactory],
      imports: [
        SharedModule,
        StoreModule.forRoot({})
      ]
    });
  });

  it('should be created', inject([InternalEventMonitorFactory], (service: InternalEventMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
