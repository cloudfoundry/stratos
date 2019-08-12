import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfServiceProvider,
} from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { populateStoreWithTestEndpoint } from '../../../../../core/test-framework/store-test-helper';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CloudFoundryComponent } from './cloud-foundry.component';

fdescribe('CloudFoundryComponent', () => {
  let component: CloudFoundryComponent;
  let fixture: ComponentFixture<CloudFoundryComponent>;

  beforeEach(
    async(() => {
      // const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity | string>>([
      //   [
      //     endpointEntitySchema,
      //     [{
      //       guid: testSCFGuid,
      //       data: testSCFEntity
      //     }],
      //   ],
      //   // [
      //   //   cfEntityFactory(organizationEntityType),
      //   //   []
      //   // ],
      //   // [
      //   //   cfEntityFactory(applicationEntityType),
      //   //   []
      //   // ],
      //   // [
      //   //   cfEntityFactory(domainEntityType),
      //   //   []
      //   // ],
      // ]);
      // const store = createEntityStoreState(entityMap) as CFAppState;

      TestBed.configureTestingModule({
        declarations: [
          CloudFoundryComponent,
          CfEndpointsMissingComponent
        ],
        imports: generateCfBaseTestModules(),
        providers: [
          PaginationMonitorFactory,
          generateTestCfServiceProvider(),
          TabNavService,
          // { provide: SKIP_ENTITY_SECTION_INIT, useValue: true }
        ]
      }).compileComponents();

      populateStoreWithTestEndpoint();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
