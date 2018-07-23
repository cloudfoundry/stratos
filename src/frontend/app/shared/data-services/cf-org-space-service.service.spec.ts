import { inject, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../core/core.module';
import { appReducers } from '../../store/reducers.module';
import { getInitialTestStoreState } from '../../test-framework/store-test-helper';
import { SharedModule } from '../shared.module';
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
