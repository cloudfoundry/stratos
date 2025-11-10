import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared, generateActiveRouteCfOrgSpaceMock } from '@test-framework/cf';
import { CfFeatureFlagsListConfigService } from './cf-feature-flags-list-config.service';

describe('CfFeatureFlagsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        generateActiveRouteCfOrgSpaceMock(),
        CfFeatureFlagsListConfigService,
      ],
      imports: generateCfBaseTestModulesNoShared(),
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfFeatureFlagsListConfigService);
    expect(service).toBeTruthy();
  });
});
