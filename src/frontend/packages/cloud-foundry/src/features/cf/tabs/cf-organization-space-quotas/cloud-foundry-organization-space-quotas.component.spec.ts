import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogTestModule,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateCFEntities, generateTestCfEndpointServiceProvider } from '@test-framework/cf';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryOrganizationSpaceQuotasComponent } from './cloud-foundry-organization-space-quotas.component';
import type { StSpaceQuota } from '../../../../services/endpoint-data/stratos-types';

describe('CloudFoundryOrganizationSpaceQuotasComponent', () => {
  let component: CloudFoundryOrganizationSpaceQuotasComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSpaceQuotasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryOrganizationSpaceQuotasComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        ...generateTestCfEndpointServiceProvider(testSCFEndpointGuid),
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: testSCFEndpointGuid,
            orgGuid: testSCFEndpointGuid,
            spaceGuid: testSCFEndpointGuid
          }
        },
      ]
    }).compileComponents();

    const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationSpaceQuotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links each space quota name to its page', () => {
    const name = component.listConfig()!.columns[0];
    expect(name.kind).toBe('link');
    expect(name.link!({ guid: 'q1' } as StSpaceQuota)).toEqual([
      '/cloud-foundry', testSCFEndpointGuid, 'organizations', testSCFEndpointGuid, 'space-quota-definitions', 'q1',
    ]);
  });
});
