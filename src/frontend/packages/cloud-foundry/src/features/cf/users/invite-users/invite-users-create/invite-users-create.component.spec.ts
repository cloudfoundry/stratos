import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { Store, StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  EntityMonitorFactory,
  PaginationMonitorFactory,
  EntityServiceFactory,
  appReducers,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModule,
  WrapperRequestActionSuccess,
  type NormalizedResponse,
  entityCatalog
} from '@stratosui/store';
import { populateStoreWithTestEndpoint, STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateCFEntities, CfUserServiceTestProvider } from '@test-framework/cf';

import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CloudFoundryReducersModule } from '../../../../../store/cloud-foundry.reducers.module';
import { UserInviteService } from '../../../user-invites/user-invite.service';
import { InviteUsersCreateComponent } from './invite-users-create.component';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { organizationEntityType, spaceEntityType } from '../../../../../cf-entity-types';

describe('InviteUsersCreateComponent', () => {
  let component: InviteUsersCreateComponent;
  let fixture: ComponentFixture<InviteUsersCreateComponent>;

  // Helper function to populate org entity in store
  function populateStoreWithTestOrg(orgGuid: string = testSCFEndpointGuid) {
    const testOrg = {
      metadata: {
        guid: orgGuid,
        created_at: '',
        updated_at: '',
        url: ''
      },
      entity: {
        name: 'Test Organization',
        billing_enabled: false,
        quota_definition_guid: '',
        status: 'active',
        quota_definition_url: '',
        spaces_url: '',
        domains_url: '',
        private_domains_url: '',
        users_url: '',
        managers_url: '',
        billing_managers_url: '',
        auditors_url: '',
        app_events_url: '',
        space_quota_definitions_url: ''
      }
    };
    const orgEntityConfig = cfEntityFactory(organizationEntityType);
    const orgEntityKey = entityCatalog.getEntityKey(orgEntityConfig);
    const mappedData = {
      entities: {
        [orgEntityKey]: {
          [orgGuid]: testOrg
        }
      },
      result: [orgGuid]
    } as NormalizedResponse;
    const store = TestBed.inject(Store);
    store.dispatch(new WrapperRequestActionSuccess(mappedData, {
      type: 'POPULATE_TEST_ORG',
      endpointType: 'cf',
      entityType: organizationEntityType,
      guid: orgGuid,
      endpointGuid: testSCFEndpointGuid
    }, 'fetch'));
  }

  // Helper function to populate space entity in store
  function populateStoreWithTestSpace(spaceGuid: string = testSCFEndpointGuid, orgGuid: string = testSCFEndpointGuid) {
    const testSpace = {
      metadata: {
        guid: spaceGuid,
        created_at: '',
        updated_at: '',
        url: ''
      },
      entity: {
        name: 'Test Space',
        organization_guid: orgGuid,
        space_quota_definition_guid: '',
        allow_ssh: true,
        organization_url: '',
        developers_url: '',
        managers_url: '',
        auditors_url: '',
        apps_url: '',
        routes_url: '',
        domains_url: '',
        service_instances_url: '',
        app_events_url: '',
        events_url: '',
        security_groups_url: '',
        staging_security_groups_url: ''
      }
    };
    const spaceEntityConfig = cfEntityFactory(spaceEntityType);
    const spaceEntityKey = entityCatalog.getEntityKey(spaceEntityConfig);
    const mappedData = {
      entities: {
        [spaceEntityKey]: {
          [spaceGuid]: testSpace
        }
      },
      result: [spaceGuid]
    } as NormalizedResponse;
    const store = TestBed.inject(Store);
    store.dispatch(new WrapperRequestActionSuccess(mappedData, {
      type: 'POPULATE_TEST_SPACE',
      endpointType: 'cf',
      entityType: spaceEntityType,
      guid: spaceGuid,
      endpointGuid: testSCFEndpointGuid
    }, 'fetch'));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InviteUsersCreateComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule,
          CloudFoundryReducersModule,
          StoreModule.forRoot(appReducers, {
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
        ...CfUserServiceTestProvider,
        UserInviteService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: {}
            }
          }
        },
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: testSCFEndpointGuid,
            orgGuid: testSCFEndpointGuid,
            spaceGuid: testSCFEndpointGuid
          }
        },
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    // Populate store with test endpoint, org, and space to prevent EmptyError from observables
    populateStoreWithTestEndpoint();
    populateStoreWithTestOrg(testSCFEndpointGuid);
    populateStoreWithTestSpace(testSCFEndpointGuid, testSCFEndpointGuid);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteUsersCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
