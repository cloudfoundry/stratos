import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { Store, StoreModule } from '@ngrx/store';

import {
  TabNavService
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import {
  EntityCatalogHelpers,
  EntityCatalogHelper,
  EntityCatalogEntityConfig,
  endpointEntityType,
  stratosEntityFactory,
  NormalizedResponse,
  WrapperRequestActionSuccess,
  EntityServiceFactory,
  appReducers,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogTestModule
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpoint, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from '@test-framework/cf';
import { EntityRelationSpecHelper } from '../../../entity-relations/entity-relations-spec-helper';
import { cfEntityFactory } from '../../../cf-entity-factory';
import { organizationEntityType, spaceEntityType } from '../../../cf-entity-types';
import { SpaceQuotaDefinitionComponent } from './space-quota-definition.component';

describe('SpaceQuotaDefinitionComponent', () => {
  let component: SpaceQuotaDefinitionComponent;
  let fixture: ComponentFixture<SpaceQuotaDefinitionComponent>;
  const cfGuid = testSCFEndpointGuid;
  const orgGuid = '123';
  const spaceGuid = '123';
  const helper = new EntityRelationSpecHelper();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SpaceQuotaDefinitionComponent,
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
        ...cfCurrentUserPermissionsService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { cfGuid, orgGuid, spaceGuid },
              params: { quotaId: 'guid' }
            }
          }
        },
        generateTestCfEndpointServiceProvider(),
        TabNavService,
      ]

    })
      .compileComponents();

    // Initialize Entity Catalog Helper AFTER compileComponents
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);

    const stratosEndpointEntityConfig: EntityCatalogEntityConfig = stratosEntityFactory(endpointEntityType);
    const stratosEndpointEntityKey = EntityCatalogHelpers.buildEntityKey(
      stratosEndpointEntityConfig.entityType,
      stratosEndpointEntityConfig.endpointType,
      );

    const orgEndpointEntityConfig: EntityCatalogEntityConfig = cfEntityFactory(organizationEntityType);
    const orgEntityKey = EntityCatalogHelpers.buildEntityKey(orgEndpointEntityConfig.entityType, orgEndpointEntityConfig.endpointType);
    const org = helper.createEmptyOrg(orgGuid, 'org');

    const spaceEndpointEntityConfig: EntityCatalogEntityConfig = cfEntityFactory(spaceEntityType);
    const spaceEntityKey = EntityCatalogHelpers.buildEntityKey(
      spaceEndpointEntityConfig.entityType,
      spaceEndpointEntityConfig.endpointType,
      );
    const space = helper.createEmptyOrg(spaceGuid, 'space');

    const mappedData = {
      entities: {
        [stratosEndpointEntityKey]: {
          [testSCFEndpoint.guid]: testSCFEndpoint,
        },
        [orgEntityKey]: {
          [org.entity.guid]: org,
        },
        [spaceEntityKey]: {
          [space.entity.guid]: space,
        }
      },
      result: [testSCFEndpoint.guid]
    } as NormalizedResponse;
    const store = TestBed.inject(Store);
    store.dispatch(new WrapperRequestActionSuccess(mappedData, {
      type: 'POPULATE_TEST_DATA',
      ...stratosEndpointEntityConfig,
    }, 'fetch'));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceQuotaDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
