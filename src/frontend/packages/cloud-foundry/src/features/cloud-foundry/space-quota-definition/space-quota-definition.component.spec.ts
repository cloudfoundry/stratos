import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import {
  createBasicStoreModule,
  getInitialTestStoreState,
  testSCFGuid,
} from '../../../../../core/test-framework/store-test-helper';
import { EntityRelationSpecHelper } from '../../../../../store/src/helpers/entity-relations/entity-relations.spec';
import { organizationEntityType, spaceEntityType } from '../../../cf-entity-factory';
import { SpaceQuotaDefinitionComponent } from './space-quota-definition.component';

describe('SpaceQuotaDefinitionComponent', () => {
  let component: SpaceQuotaDefinitionComponent;
  let fixture: ComponentFixture<SpaceQuotaDefinitionComponent>;
  const cfGuid = testSCFGuid;
  const orgGuid = '123';
  const spaceGuid = '123';

  const helper = new EntityRelationSpecHelper();

  beforeEach(async(() => {
    const store = getInitialTestStoreState();
    store.requestData[organizationEntityType][orgGuid] = helper.createEmptyOrg(orgGuid, 'org-name');
    store.requestData[spaceEntityType][spaceGuid] = helper.createEmptySpace(spaceGuid, 'space-name', orgGuid);
    TestBed.configureTestingModule({
      declarations: [SpaceQuotaDefinitionComponent],
      imports: [
        ...BaseTestModules,
        createBasicStoreModule(store),
      ],
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
