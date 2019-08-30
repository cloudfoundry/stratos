import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { organizationSchemaKey, spaceSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { EntityRelationSpecHelper } from '../../../../../store/src/helpers/entity-relations/entity-relations.spec';
import { TabNavService } from '../../../../tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule, getInitialTestStoreState, testSCFGuid } from '../../../../test-framework/store-test-helper';
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
    store.requestData[organizationSchemaKey][orgGuid] = helper.createEmptyOrg(orgGuid, 'org-name');
    store.requestData[spaceSchemaKey][spaceGuid] = helper.createEmptySpace(spaceGuid, 'space-name', orgGuid);
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
