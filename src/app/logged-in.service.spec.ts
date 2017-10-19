import { TestBed, inject } from '@angular/core/testing';

import { LoggedInService } from './logged-in.service';
import { StoreModule } from '@ngrx/store';
import { CoreModule } from './core/core.module';
import { appReducers } from './store/reducers.module';
import { getInitialTestStoreState } from './test-framework/store-test-helper';

fdescribe('LoggedInService', () => {
  const initialState = getInitialTestStoreState();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggedInService],
      imports: [
        CoreModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          })
      ]
    });
  });

  it('should be created', inject([LoggedInService], (service: LoggedInService) => {
    expect(service).toBeTruthy();
  }));
});
