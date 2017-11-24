import { TestBed, inject } from '@angular/core/testing';

import { UserService } from './user.service';
import { CoreModule } from './core.module';
import { SharedModule } from '../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../store/reducers.module';
import { getInitialTestStoreState } from '../test-framework/store-test-helper';

describe('UserService', () => {
  beforeEach(() => {
    const initialState = getInitialTestStoreState();

    TestBed.configureTestingModule({
      providers: [UserService],
      imports: [
        CoreModule,
        SharedModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          }),
      ]
    });
  });

  it('should be created', inject([UserService], (service: UserService) => {
    expect(service).toBeTruthy();
  }));
});
