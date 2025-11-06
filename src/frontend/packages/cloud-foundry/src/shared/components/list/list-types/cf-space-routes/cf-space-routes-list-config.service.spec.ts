import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfSpaceRoutesListConfigService } from './cf-space-routes-list-config.service';

describe('CfSpaceRoutesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        CfSpaceRoutesListConfigService,
        {
          provide: CloudFoundrySpaceService,
          useClass: CloudFoundrySpaceServiceMock
        },
        DatePipe
      ,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpaceRoutesListConfigService);
    expect(service).toBeTruthy();
  });
});
