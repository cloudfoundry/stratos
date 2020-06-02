import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { populateStoreWithTestEndpoint, testSCFEndpointGuid } from '@stratosui/store/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base.component';

describe('CloudFoundryTabsBaseComponent', () => {
  let component: CloudFoundryTabsBaseComponent;
  let fixture: ComponentFixture<CloudFoundryTabsBaseComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryTabsBaseComponent],
        imports: generateCfBaseTestModules(),
        providers: [
          CloudFoundryEndpointService,
          generateTestCfEndpointServiceProvider(),
          { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: testSCFEndpointGuid } },
          TabNavService,
        ]
      }).compileComponents();

      populateStoreWithTestEndpoint();
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

  afterAll(() => { });
});
