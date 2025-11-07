import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import {
  EntityCatalogTestModuleManualStore,
  EntityServiceFactory,
  generateStratosEntities,
  InternalEventMonitorFactory,
  TEST_CATALOGUE_ENTITIES,
  UserFavoriteManager,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CurrentUserPermissionsService, SessionService } from '@stratosui/core';
import { EndpointListHelper } from './endpoint-list.helpers';
import { EndpointsListConfigService } from './endpoints-list-config.service';

describe('EndpointsListConfigService', () => {
  // Mock services
  const mockSessionService = {
    userEndpointsEnabled: () => of(false),
    userEndpointsNotDisabled: () => of(false),
    isTechPreview: () => of(false)
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModuleManualStore,
      ],
      providers: [
        EntityServiceFactory,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: generateStratosEntities()
        },
        EndpointListHelper,
        CurrentUserPermissionsService,
        InternalEventMonitorFactory,
        UserFavoriteManager,
        { provide: SessionService, useValue: mockSessionService },
        ...STORE_TEST_PROVIDERS,
        provideHttpClient(),
        provideZonelessChangeDetection(),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(EndpointsListConfigService);
    expect(service).toBeTruthy();
  });
});
