import { DatePipe } from '@angular/common';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared, generateActiveRouteCfOrgSpaceMock } from '@test-framework/cf';
import { CfSpaceQuotasListConfigService } from './cf-space-quotas-list-config.service';

describe('CfSpaceQuotasListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        generateActiveRouteCfOrgSpaceMock(),
        CfSpaceQuotasListConfigService,
        DatePipe,
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpaceQuotasListConfigService);
    expect(service).toBeTruthy();
  });
});
