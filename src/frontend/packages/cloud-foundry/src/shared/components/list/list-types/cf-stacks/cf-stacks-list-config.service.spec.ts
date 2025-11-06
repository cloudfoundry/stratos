import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfStacksListConfigService } from './cf-stacks-list-config.service';

describe('CfStacksListConfigService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [CfStacksListConfigService, ActiveRouteCfOrgSpace],
      imports: generateCfBaseTestModules()
    }).compileComponents();
  });

  it('should be created', () => {
    const service = TestBed.inject(CfStacksListConfigService);
    expect(service).toBeTruthy();
  });
});
