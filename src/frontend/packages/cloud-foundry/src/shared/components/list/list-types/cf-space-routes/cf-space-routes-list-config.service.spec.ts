import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ConfirmationDialogService,
  CurrentUserPermissionsService
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
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
import { generateCFEntities, ActiveRouteCfOrgSpace } from '@test-framework/cf';
import { CFAppState } from '../../../../../cf-app-state';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfSpaceRoutesListConfigService } from "./cf-space-routes-list-config.service";

class CloudFoundrySpaceServiceMock {
  cfGuid = testSCFEndpointGuid;
  spaceGuid = testSCFEndpointGuid;
}

describe('CfSpaceRoutesListConfigService', () => {
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
        EntityServiceFactory,
        PaginationMonitorFactory,
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: testSCFEndpointGuid,
            orgGuid: testSCFEndpointGuid,
            spaceGuid: testSCFEndpointGuid
          }
        },
        {
          provide: CloudFoundrySpaceService,
          useClass: CloudFoundrySpaceServiceMock,
        },
        {
          provide: CfSpaceRoutesListConfigService,
          useFactory: () => new CfSpaceRoutesListConfigService(),
        },
        DatePipe,
        ...cfCurrentUserPermissionsService,
      ]
    });

    // Initialize EntityCatalogHelper
    const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

    populateStoreWithTestEndpoint();
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpaceRoutesListConfigService);
    expect(service).toBeTruthy();
  });
});
