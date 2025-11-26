import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom, NO_ERRORS_SCHEMA } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';

import {
  EntityMonitorFactory,
  PaginationMonitorFactory,
  EntityServiceFactory,
  appReducers,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModule
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities, CfUserServiceTestProvider, generateCfTopLevelStoreEntities } from '@test-framework/cf';
import { CloudFoundryReducersModule } from '../../../../../store/cloud-foundry.reducers.module';
import { TabNavService } from '@stratosui/core';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { UsersRolesModifyComponent } from './manage-users-modify.component';

describe('UsersRolesModifyComponent', () => {
  let component: UsersRolesModifyComponent;
  let fixture: ComponentFixture<UsersRolesModifyComponent>;

  beforeEach(() => {
    // Create mocks for CfRolesService to prevent EmptyErrors
    const mockOrgEntity = {
      entity: {
        metadata: { guid: 'org-guid', created_at: '', updated_at: '', url: '' },
        entity: { name: 'Test Org', guid: 'org-guid' }
      },
      entityRequestInfo: { fetching: false }
    };

    const mockCfRolesService = {
      loading$: new BehaviorSubject<boolean>(false).asObservable(),
      existingRoles$: new BehaviorSubject<Record<string, unknown>>({}).asObservable(),
      newRoles$: new BehaviorSubject<Record<string, unknown>>({}).asObservable(),
      fetchOrg: vi.fn().mockReturnValue(of(mockOrgEntity)),
      fetchOrgEntity: vi.fn().mockReturnValue(of(mockOrgEntity.entity)),
      fetchOrgs: vi.fn().mockReturnValue(of([mockOrgEntity.entity])),
      createRolesDiff: vi.fn().mockReturnValue(of([]))
    };

    TestBed.configureTestingModule({
      imports: [
        UsersRolesModifyComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          HttpClientTestingModule,
          EntityCatalogTestModule,
          CloudFoundryReducersModule,
          StoreModule.forRoot(appReducers, {
            initialState: generateCfTopLevelStoreEntities() as Record<string, unknown>,
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          })
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EntityCatalogHelper,
        CfUserServiceTestProvider,
        { provide: CfRolesService, useValue: mockCfRolesService },
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { breadcrumbs: 'key' },
              params: {}
            }
          }
        },
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
      ],
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersRolesModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
