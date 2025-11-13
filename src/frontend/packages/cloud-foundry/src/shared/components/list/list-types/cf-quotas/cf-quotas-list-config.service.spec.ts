import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared, generateActiveRouteCfOrgSpaceMock } from '@test-framework/cf';
import {
  ConfirmationDialogService
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { CfQuotasListConfigService } from './cf-quotas-list-config.service';

describe('CfQuotasListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...STORE_TEST_PROVIDERS,
        generateActiveRouteCfOrgSpaceMock(),
        CfQuotasListConfigService,
        DatePipe,
        ConfirmationDialogService,
        ...cfCurrentUserPermissionsService,
        provideRouter([]),
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModulesNoShared()
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfQuotasListConfigService);
    expect(service).toBeTruthy();
  });
});
