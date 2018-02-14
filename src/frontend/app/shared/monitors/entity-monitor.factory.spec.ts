import { TestBed, inject } from '@angular/core/testing';

import { EntityMonitorFactory } from './entity-monitor.factory.service';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../store/reducers.module';
import { getInitialTestStoreState } from '../../test-framework/store-test-helper';
const initialState = getInitialTestStoreState();
describe('EntityMonitor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityMonitorFactory],
      imports: [
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        )
      ]
    });
  });

  it('should be created', inject([EntityMonitorFactory], (service: EntityMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
