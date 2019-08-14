import { inject, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../../../../store/src/reducers.module';
import { PaginationMonitorFactory } from './pagination-monitor.factory';

// const initialState = getInitialTestStoreState();
// TODO: RC Remove
describe('PaginationMonitorFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaginationMonitorFactory],
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

  it('should be created', inject([PaginationMonitorFactory], (service: PaginationMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
