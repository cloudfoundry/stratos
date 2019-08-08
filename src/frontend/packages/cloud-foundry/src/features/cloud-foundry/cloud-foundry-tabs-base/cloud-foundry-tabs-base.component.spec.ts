import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { endpointEntitySchema } from '../../../../../core/src/base-entity-schemas';
import { SKIP_ENTITY_SECTION_INIT } from '../../../../../core/src/core/entity-catalogue.module';
import { EntityCatalogueEntityConfig } from '../../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import {
  createEntityStoreState,
  testSCFEntity,
  testSCFGuid,
  TestStoreEntity,
} from '../../../../../core/test-framework/store-test-helper';
import { CFAppState } from '../../../cf-app-state';
import {
  applicationEntityType,
  cfEntityFactory,
  domainEntityType,
  organizationEntityType,
} from '../../../cf-entity-factory';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base.component';

fdescribe('CloudFoundryTabsBaseComponent', () => {
  let component: CloudFoundryTabsBaseComponent;
  let fixture: ComponentFixture<CloudFoundryTabsBaseComponent>;
  beforeEach(
    async(() => {
      const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity>>([
        [
          endpointEntitySchema,
          [{
            guid: testSCFGuid,
            data: testSCFEntity
          }],
        ],
        [
          cfEntityFactory(organizationEntityType),
          []
        ],
        [
          cfEntityFactory(applicationEntityType),
          []
        ],
        [
          cfEntityFactory(domainEntityType),
          []
        ],
      ]);
      const store = createEntityStoreState(entityMap) as CFAppState;
      console.log(JSON.stringify(store));


      TestBed.configureTestingModule({
        declarations: [CloudFoundryTabsBaseComponent],
        imports: generateCfBaseTestModules(store),
        providers: [
          CloudFoundryEndpointService,
          generateTestCfEndpointServiceProvider(),
          { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: testSCFGuid } },
          TabNavService,
          { provide: SKIP_ENTITY_SECTION_INIT, useValue: true }
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryTabsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
