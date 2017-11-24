import { CoreModule } from './core.module';
import { TestBed, inject } from '@angular/core/testing';

import { EndpointsService } from './endpoints.service';
import { getInitialTestStoreState } from '../test-framework/store-test-helper';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../store/reducers.module';
import { UtilsService } from './utils.service';

describe('EndpointsService', () => {
  const initialState = getInitialTestStoreState();
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndpointsService, UtilsService],
      imports: [
        CoreModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          }),
      ]
    });
  });

  it('should be created', inject([EndpointsService], (service: EndpointsService) => {
    expect(service).toBeTruthy();
  }));
});
