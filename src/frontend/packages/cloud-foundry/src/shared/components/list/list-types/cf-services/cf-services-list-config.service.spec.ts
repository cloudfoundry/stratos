import { TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  EntityCatalogTestModule,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES,
  appReducers,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityServiceFactory,
  EntityMonitorFactory,
  PaginationMonitorFactory
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CloudFoundryTestingModule } from '@test-framework/cf';
import { generateCFEntities } from '../../../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfServicesListConfigService } from './cf-services-list-config.service';

describe('CfServicesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        CfServicesListConfigService,
        importProvidersFrom(
          CloudFoundryTestingModule,
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          }),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EntityCatalogHelper,
      ],
    });

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(CfServicesListConfigService);
    expect(service).toBeTruthy();
  });
});
