import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { generateCfBaseTestModulesNoShared, STORE_TEST_PROVIDERS } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from '../../../cf-entity-generator';
import { CsiModeService } from './csi-mode.service';

describe('CsiModeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CsiModeService,
        provideZonelessChangeDetection(),
      ],
      imports: [
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            ...STORE_TEST_PROVIDERS,
            { provide: TEST_CATALOGUE_ENTITIES, useValue: generateCFEntities() }
          ]
        },
        ...generateCfBaseTestModulesNoShared(),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CsiModeService);
    expect(service).toBeTruthy();
  });
});
