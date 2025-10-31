import { inject, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfSecurityGroupsListConfigService } from './cf-security-groups-list-config.service';

describe('CfSecurityGroupsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSecurityGroupsListConfigService, ActiveRouteCfOrgSpace],
      imports: generateCfBaseTestModules()

    });
  });

  it('should be created', inject([CfSecurityGroupsListConfigService], (service: CfSecurityGroupsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
