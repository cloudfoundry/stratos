import { MockBackend } from '@angular/http/testing';
import { XHRBackend } from '@angular/http';
import { CoreModule } from './core.module';
import { TestBed, inject } from '@angular/core/testing';

import { LoggerService } from './logger.service';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../store/reducers.module';
import { getInitialTestStoreState } from '../test-framework/store-test-helper';

describe('LoggerService', () => {
  const initialState = getInitialTestStoreState();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggerService
      ],
      imports: [
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ]
    });
  });

  it('should be created', inject([LoggerService], (service: LoggerService) => {
    expect(service).toBeTruthy();
  }));
});
