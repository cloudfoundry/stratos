import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateCFEntities, generateTestCfEndpointServiceProvider, ActiveRouteCfOrgSpace } from '@test-framework/cf';
import { CfAppsSignalConfigService } from '../../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CloudFoundrySummaryTabComponent } from './cloud-foundry-summary-tab.component';

describe('CloudFoundrySummaryTabComponent', () => {
  let component: CloudFoundrySummaryTabComponent;
  let fixture: ComponentFixture<CloudFoundrySummaryTabComponent>;
  let appsConfig: { selectedOrg: ReturnType<typeof signal<string | null>>; selectedSpace: ReturnType<typeof signal<string | null>> };

  beforeEach(async () => {
    appsConfig = {
      selectedOrg: signal<string | null>(null),
      selectedSpace: signal<string | null>(null),
    };
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundrySummaryTabComponent,
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
        { provide: CfAppsSignalConfigService, useValue: appsConfig },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySummaryTabComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering child components that need additional setup
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The Applications tile must stay inside the CF section — it used to call
  // goToAppWall(), landing on the global /applications wall and dropping the
  // CF context (the side nav reverted to the global menu). See #5638.
  describe('Applications tile link', () => {
    it('opens this CF Applications tab, not the application wall', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      component.appLink();

      expect(navigate).toHaveBeenCalledWith(['/cloud-foundry', testSCFEndpointGuid, 'applications']);
    });

    it('clears any org/space scope left on the shared apps config', () => {
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      // Seed the scope a previous app-wall or org visit would have left behind:
      // the tab self-scopes to the CNSI but deliberately keeps org/space.
      appsConfig.selectedOrg.set('stale-org');
      appsConfig.selectedSpace.set('stale-space');

      component.appLink();

      expect(appsConfig.selectedOrg()).toBeNull();
      expect(appsConfig.selectedSpace()).toBeNull();
    });
  });
});
