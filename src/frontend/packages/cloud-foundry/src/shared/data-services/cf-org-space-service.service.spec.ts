import { inject, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from './cf-org-space-service.service';
import { HttpClientModule } from '@angular/common/http';

describe('EndpointOrgSpaceServiceService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfOrgSpaceDataService],
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        CoreModule,
        HttpClientModule,
      ]
    });
  });

  it('should be created', inject([CfOrgSpaceDataService], (service: CfOrgSpaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
