import { inject, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../../../../store/src/reducers.module';
import { EntityMonitorFactory } from './entity-monitor.factory.service';

// TODO: RC remove
// const initialState = getInitialTestStoreState();
fdescribe('EntityMonitor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityMonitorFactory],
      imports: [
        StoreModule.forRoot(
          appReducers,
          // {
          //   initialState
          // }
        )
      ]
    });
  });

  it('should be created', inject([EntityMonitorFactory], (service: EntityMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
