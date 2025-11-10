import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  appReducers,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModule,
  EntityServiceFactory,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '@test-framework/cf';
import { DetachAppsListConfigService } from './detach-apps-list-config.service';

describe('DetachAppsListConfigService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          }),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityCatalogHelper,
        EntityServiceFactory,
        DetachAppsListConfigService,
        DatePipe,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                serviceInstanceId: 'serviceInstanceId',
                endpointId: 'endpointId'
              }
            }
          }
        },
      ],
    })
      .compileComponents();

    // Initialize EntityCatalogHelper AFTER compileComponents (like passing test does)
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(DetachAppsListConfigService);
    expect(service).toBeTruthy();
  });
});
