import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  appReducers,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogTestModule,
  EntityServiceFactory,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  PaginationMonitorFactory
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateCFEntities, generateTestCfEndpointServiceProvider, ActiveRouteCfOrgSpace } from '@test-framework/cf';
import { CfBuildpacksListConfigService } from '../../../../shared/components/list/list-types/cf-buildpacks/cf-buildpacks-list-config.service';
import { CloudFoundryBuildPacksComponent } from './cloud-foundry-build-packs.component';

describe('CloudFoundryBuildPacksComponent', () => {
  let component: CloudFoundryBuildPacksComponent;
  let fixture: ComponentFixture<CloudFoundryBuildPacksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryBuildPacksComponent,
      ],
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
        EntityServiceFactory,
        PaginationMonitorFactory,
        ...generateTestCfEndpointServiceProvider(testSCFEndpointGuid),
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: testSCFEndpointGuid,
            orgGuid: testSCFEndpointGuid,
            spaceGuid: testSCFEndpointGuid
          }
        },
        CfBuildpacksListConfigService,
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryBuildPacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
