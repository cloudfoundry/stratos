import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfSecurityGroupsListConfigService } from "./cf-security-groups-list-config.service";
describe('CfSecurityGroupsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfSecurityGroupsListConfigService, ActiveRouteCfOrgSpace,
        provideZonelessChangeDetection(),
      ],
      imports: generateCfBaseTestModules(),

    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSecurityGroupsListConfigService);
    expect(service).toBeTruthy();
  });
});
