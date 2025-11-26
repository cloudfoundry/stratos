import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

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
import { ServiceCatalogPageComponent } from "./service-catalog-page.component";

describe('ServiceCatalogPageComponent', () => {
  let component: ServiceCatalogPageComponent;
  let fixture: ComponentFixture<ServiceCatalogPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServiceCatalogPageComponent,
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
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceCatalogPageComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() yet - let the test control this
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
