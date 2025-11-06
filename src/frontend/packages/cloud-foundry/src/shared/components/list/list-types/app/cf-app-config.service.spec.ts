import { CommonModule, DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

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
        SharedModule,
        generateCfStoreModules(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfAppConfigService);
    expect(service).toBeTruthy();
  });
});
