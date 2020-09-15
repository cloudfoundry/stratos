import { inject, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../reducers.module';
import { PaginationMonitorFactory } from './pagination-monitor.factory';

describe('PaginationMonitorFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaginationMonitorFactory],
      imports: [
        StoreModule.forRoot(
          appReducers,
        )
      ]
    });
  });

  it('should be created', inject([PaginationMonitorFactory], (service: PaginationMonitorFactory) => {
    expect(service).toBeTruthy();
  }));
});
