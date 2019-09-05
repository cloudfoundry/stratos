import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { endpointEntitySchema } from '../../../../../core/src/base-entity-schemas';
import { EntityCatalogueHelpers } from '../../../../../core/src/core/entity-catalogue/entity-catalogue.helper';
import { EntityCatalogueEntityConfig } from '../../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { TabNavService } from '../../../../../core/tab-nav.service';
import { testSCFEndpoint, testSCFEndpointGuid } from '../../../../../core/test-framework/store-test-helper';
import { EntityRelationSpecHelper } from '../../../../../store/src/helpers/entity-relations/entity-relations-spec-helper';
import { NormalizedResponse } from '../../../../../store/src/types/api.types';
import { WrapperRequestActionSuccess } from '../../../../../store/src/types/request.types';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { cfEntityFactory, organizationEntityType, spaceEntityType } from '../../../cf-entity-factory';
import { SpaceQuotaDefinitionComponent } from './space-quota-definition.component';

describe('SpaceQuotaDefinitionComponent', () => {
  let component: SpaceQuotaDefinitionComponent;
  let fixture: ComponentFixture<SpaceQuotaDefinitionComponent>;
  const cfGuid = testSCFEndpointGuid;
  const orgGuid = '123';
  const spaceGuid = '123';

  const helper = new EntityRelationSpecHelper();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SpaceQuotaDefinitionComponent
      ],
      imports: generateCfBaseTestModules(),
      providers: [
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


    const stratosEndpointEntityConfig: EntityCatalogueEntityConfig = endpointEntitySchema;
    const stratosEndpointEntityKey = EntityCatalogueHelpers.buildEntityKey(
      stratosEndpointEntityConfig.entityType,
      stratosEndpointEntityConfig.endpointType
    );

    const orgEndpointEntityConfig: EntityCatalogueEntityConfig = cfEntityFactory(organizationEntityType);
    const orgEntityKey = EntityCatalogueHelpers.buildEntityKey(orgEndpointEntityConfig.entityType, orgEndpointEntityConfig.endpointType);
    const org = helper.createEmptyOrg(orgGuid, 'org');

    const spaceEndpointEntityConfig: EntityCatalogueEntityConfig = cfEntityFactory(spaceEntityType);
    const spaceEntityKey = EntityCatalogueHelpers.buildEntityKey(
      spaceEndpointEntityConfig.entityType,
      spaceEndpointEntityConfig.endpointType
    );
    const space = helper.createEmptyOrg(spaceGuid, 'space');

    const mappedData = {
      entities: {
        [stratosEndpointEntityKey]: {
          [testSCFEndpoint.guid]: testSCFEndpoint
        },
        [orgEntityKey]: {
          [org.entity.guid]: org
        },
        [spaceEntityKey]: {
          [space.entity.guid]: space
        }
      },
      result: [testSCFEndpoint.guid]
    } as NormalizedResponse;
    const store = TestBed.get(Store);
    store.dispatch(new WrapperRequestActionSuccess(mappedData, {
      type: 'POPULATE_TEST_DATA',
      ...stratosEndpointEntityConfig
    }, 'fetch'));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceQuotaDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
