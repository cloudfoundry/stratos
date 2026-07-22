import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
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
import { CloudFoundrySecurityGroupsComponent } from './cloud-foundry-security-groups.component';

describe('CloudFoundrySecurityGroupsComponent', () => {
  let component: CloudFoundrySecurityGroupsComponent;
  let fixture: ComponentFixture<CloudFoundrySecurityGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundrySecurityGroupsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
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
    fixture = TestBed.createComponent(CloudFoundrySecurityGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Guard: the "Bind to spaces" per-row affordance must be present on the
  // list config. Removing the actions column or the bind action fails here.
  it('exposes a "Bind to spaces" row action', () => {
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();

    const actionsCol = cfg!.columns.find(col => col.key === 'actions');
    expect(actionsCol).toBeDefined();
    expect(actionsCol!.actions).toBeDefined();

    const sampleGroup = {
      guid: 'sg-1', name: 'public_networks',
      globallyEnabledRunning: true, globallyEnabledStaging: false,
      ruleCount: 1, runningSpaceCount: 0, stagingSpaceCount: 0,
      cnsiGuid: testSCFEndpointGuid,
      createdAt: '2026-04-22T12:00:00Z', updatedAt: '2026-04-22T12:00:00Z',
    };
    const actions = actionsCol!.actions!(sampleGroup);
    expect(actions.some(a => a.label === 'Bind to spaces')).toBe(true);
  });
});
