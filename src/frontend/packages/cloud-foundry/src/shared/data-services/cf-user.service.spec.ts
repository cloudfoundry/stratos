import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { HttpClientModule } from '@angular/common/http';

import { SharedModule } from '../../../../core/src/shared/shared.module';
import {
  generateCfStoreModules,
  generateTestCfEndpointServiceProvider,
} from '@test-framework/cloud-foundry-endpoint-service.helper';
import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { generateCFEntities } from '../../cf-entity-generator';
import { CfUserService } from './cf-user.service';

describe('CfUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        HttpClientModule,
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateCFEntities(),
                ...generateStratosEntities(),
              ]
            }
          ]
        },
      ],
      providers: [
        ...generateTestCfEndpointServiceProvider(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfUserService);
    expect(service).toBeTruthy();
  });
});
