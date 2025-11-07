import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfBuildpacksListConfigService } from "./cf-buildpacks-list-config.service";
describe('CfBuildpacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...STORE_TEST_PROVIDERS,
        CfBuildpacksListConfigService,
        ActiveRouteCfOrgSpace,
        provideZonelessChangeDetection(),
      ],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfBuildpacksListConfigService);
    expect(service).toBeTruthy();
  });
});
