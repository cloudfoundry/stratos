import { TestBed, inject } from '@angular/core/testing';

import { PaginationMonitorFactory } from './pagination-monitor.factory';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../store/reducers.module';
import { getInitialTestStoreState } from '../../test-framework/store-test-helper';
const initialState = getInitialTestStoreState();
describe('PaginationMonitorFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaginationMonitorFactory],
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

  it('should be created', inject([PaginationMonitorFactory], (service: PaginationMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
