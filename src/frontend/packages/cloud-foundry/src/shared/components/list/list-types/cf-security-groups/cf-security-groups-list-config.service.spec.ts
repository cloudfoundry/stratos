import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared, generateActiveRouteCfOrgSpaceMock } from '@test-framework/cf';
import { CfSecurityGroupsListConfigService } from './cf-security-groups-list-config.service';

describe('CfSecurityGroupsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        generateActiveRouteCfOrgSpaceMock(),
        CfSecurityGroupsListConfigService,
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSecurityGroupsListConfigService);
    expect(service).toBeTruthy();
  });
});
