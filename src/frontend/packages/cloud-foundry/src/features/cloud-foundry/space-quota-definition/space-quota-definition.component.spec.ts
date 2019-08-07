import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { EntityCatalogueEntityConfig } from '../../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { createEntityStoreState, testSCFGuid, TestStoreEntity } from '../../../../../core/test-framework/store-test-helper';
import { EntityRelationSpecHelper } from '../../../../../store/src/helpers/entity-relations/entity-relations-spec-helper';
import { CFAppState } from '../../../cf-app-state';
import { cfEntityFactory, organizationEntityType, spaceEntityType } from '../../../cf-entity-factory';
import { SpaceQuotaDefinitionComponent } from './space-quota-definition.component';

describe('SpaceQuotaDefinitionComponent', () => {
  let component: SpaceQuotaDefinitionComponent;
  let fixture: ComponentFixture<SpaceQuotaDefinitionComponent>;
  const cfGuid = testSCFGuid;
  const orgGuid = '123';
  const spaceGuid = '123';

  const helper = new EntityRelationSpecHelper();

  beforeEach(async(() => {
    // TODO: RC search for getInitialTestStoreState in cf module and replace
    const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity | string>>([
      [
        cfEntityFactory(organizationEntityType),
        [{
          guid: orgGuid,
          data: helper.createEmptyOrg(orgGuid, 'org-name')
        }]
      ],
      [
        cfEntityFactory(spaceEntityType),
        [{
          guid: spaceGuid,
          data: helper.createEmptySpace(spaceGuid, 'space-name', orgGuid)
        }]
      ]
    ]);
    const store = createEntityStoreState(entityMap) as CFAppState;

    TestBed.configureTestingModule({
      declarations: [
        SpaceQuotaDefinitionComponent
      ],
      imports: generateCfBaseTestModules(store),
      providers: [{
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: { cfGuid, orgGuid, spaceGuid },
            params: { quotaId: 'guid' }
          }
        }
      },
      generateTestCfEndpointServiceProvider(), TabNavService]

    })
      .compileComponents();
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
