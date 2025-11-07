import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModules } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from '../../../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfFeatureFlagsListConfigService } from './cf-feature-flags-list-config.service';

describe('CfFeatureFlagsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfFeatureFlagsListConfigService,
        ActiveRouteCfOrgSpace,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
      imports: [
        ...generateCfBaseTestModules(),
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
                ...generateCFEntities()
              ]
            }
          ]
        }
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfFeatureFlagsListConfigService);
    expect(service).toBeTruthy();
  });
});
