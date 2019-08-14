import { CommonModule, DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../../data-services/cf-org-space-service.service';
import { CfAppConfigService } from './cf-app-config.service';


describe('CfAppConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppConfigService,
        DatePipe,
        CfOrgSpaceDataService
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        generateCfStoreModules(),
      ]
    });
  });

  it('should be created', inject([CfAppConfigService], (service: CfAppConfigService) => {
    expect(service).toBeTruthy();
  }));
});
