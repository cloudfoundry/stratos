import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { createBasicStoreModule, testSCFEndpointGuid, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  EntityCatalogTestModule,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { CF_BASE_TEST_PROVIDERS, generateCfActiveRouteMock } from '@test-framework/cf';

import { generateCFEntities } from '../../../cf-entity-generator';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CfUserPermissionDirective } from '../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { ServicesWallComponent } from './services-wall.component';

describe('ServicesWallComponent', () => {
  let component: ServicesWallComponent;
  let fixture: ComponentFixture<ServicesWallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServicesWallComponent,
        CfEndpointsMissingComponent,
        CfUserPermissionDirective,
        NoopAnimationsModule,
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
        importProvidersFrom(createBasicStoreModule()),
        ...STORE_TEST_PROVIDERS,
        EntityCatalogHelper,
        ...CF_BASE_TEST_PROVIDERS,
        generateCfActiveRouteMock(testSCFEndpointGuid),
        CloudFoundryService,
        CfOrgSpaceDataService,
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
