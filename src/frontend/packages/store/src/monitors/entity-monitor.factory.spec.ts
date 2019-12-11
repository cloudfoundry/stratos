import { inject, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../reducers.module';
import { EntityMonitorFactory } from './entity-monitor.factory.service';

describe('EntityMonitor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityMonitorFactory],
      imports: [
        StoreModule.forRoot(
          appReducers,
        )
      ]
    });
  });

  it('should be created', inject([EntityMonitorFactory], (service: EntityMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
