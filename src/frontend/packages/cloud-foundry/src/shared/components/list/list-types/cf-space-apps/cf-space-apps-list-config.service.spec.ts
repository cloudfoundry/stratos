import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfSpaceAppsListConfigService } from './cf-space-apps-list-config.service';

describe('CfSpaceAppsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        CfSpaceAppsListConfigService,
        DatePipe,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock }
      ,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpaceAppsListConfigService);
    expect(service).toBeTruthy();
  });
});
