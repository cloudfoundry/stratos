import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModule, generateStratosEntities, PaginationMonitorFactory, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { CF_BASE_TEST_PROVIDERS, generateCfActiveRouteMock } from '@test-framework/cf';

import { generateCFEntities } from '../../../cf-entity-generator';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CloudFoundryComponent } from './cloud-foundry.component';

describe('CloudFoundryComponent', () => {
  let component: CloudFoundryComponent;
  let fixture: ComponentFixture<CloudFoundryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryComponent,
        CfEndpointsMissingComponent,
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
        provideZonelessChangeDetection(),
        importProvidersFrom(createBasicStoreModule()),
        ...STORE_TEST_PROVIDERS,
        EntityCatalogHelper,
        ...CF_BASE_TEST_PROVIDERS,
        generateCfActiveRouteMock(testSCFEndpointGuid),
        PaginationMonitorFactory,
        CloudFoundryService,
        TabNavService,
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    // Populate store with test endpoint data to prevent EmptyError
    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
