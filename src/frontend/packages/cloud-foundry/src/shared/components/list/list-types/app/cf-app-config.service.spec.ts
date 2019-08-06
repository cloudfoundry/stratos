import { CommonModule, DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CfAppConfigService } from './cf-app-config.service';


describe('CfAppConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppConfigService,
        DatePipe
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        generateCfStoreModules()
      ]
    });
  });

  it('should be created', inject([CfAppConfigService], (service: CfAppConfigService) => {
    expect(service).toBeTruthy();
  }));
});
