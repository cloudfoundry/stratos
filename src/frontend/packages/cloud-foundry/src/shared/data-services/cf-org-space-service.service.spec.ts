import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from './cf-org-space-service.service';
import { HttpClientModule } from '@angular/common/http';

describe('EndpointOrgSpaceServiceService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfOrgSpaceDataService,
        provideZonelessChangeDetection(),
      ],
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        CoreModule,
        HttpClientModule,
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    expect(service).toBeTruthy();
  });
});
