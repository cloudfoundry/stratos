import { inject, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { getInitialTestStoreState } from '../../../../core/test-framework/store-test-helper';
import { appReducers } from '../../../../store/src/reducers.module';
import { CfOrgSpaceDataService } from './cf-org-space-service.service';

describe('EndpointOrgSpaceServiceService', () => {
  const initialState = { ...getInitialTestStoreState() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfOrgSpaceDataService],
      imports: [
        SharedModule,
        CoreModule,
        HttpModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ]
    });
  });

  it('should be created', inject([CfOrgSpaceDataService], (service: CfOrgSpaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
