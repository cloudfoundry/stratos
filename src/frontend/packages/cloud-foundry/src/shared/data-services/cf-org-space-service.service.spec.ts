import { inject, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from './cf-org-space-service.service';

describe('EndpointOrgSpaceServiceService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfOrgSpaceDataService],
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        CoreModule,
        HttpModule,
      ]
    });
  });

  it('should be created', inject([CfOrgSpaceDataService], (service: CfOrgSpaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
