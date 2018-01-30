import { SharedModule } from '../shared.module';
import { TestBed, inject } from '@angular/core/testing';
import { CfOrgSpaceDataService } from './cf-org-space-service.service';
import { CoreModule } from '../../core/core.module';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../store/reducers.module';
import { getInitialTestStoreState } from '../../test-framework/store-test-helper';


describe('EndpointOrgSpaceServiceService', () => {
  const initialState = { ...getInitialTestStoreState() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfOrgSpaceDataService],
      imports: [
        SharedModule,
        CoreModule,
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
