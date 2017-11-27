import { TestBed, inject } from '@angular/core/testing';

import { CfAuthService } from './cf-auth.service';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';

describe('CfAuthService', () => {
  beforeEach(() => {
    const initialState = getInitialTestStoreState();

    TestBed.configureTestingModule({
      providers: [CfAuthService],
      imports: [
        StoreModule.forRoot(appReducers,
          {
            initialState
          }),
      ]
    });
  });

  it('should be created', inject([CfAuthService], (service: CfAuthService) => {
    expect(service).toBeTruthy();
  }));
});
