import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cf";
import { CfBuildpacksListConfigService } from "./cf-buildpacks-list-config.service";

describe('CfBuildpacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CfBuildpacksListConfigService,
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfBuildpacksListConfigService);
    expect(service).toBeTruthy();
  });
});
