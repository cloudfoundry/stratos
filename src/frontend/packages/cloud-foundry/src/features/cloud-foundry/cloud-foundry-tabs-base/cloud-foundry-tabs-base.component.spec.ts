import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { testSCFGuid } from '../../../../../core/test-framework/store-test-helper';
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
        imports: [...BaseTestModules],
        providers: [
          CloudFoundryEndpointService,
          generateTestCfEndpointServiceProvider(),
          { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: testSCFGuid } },
          TabNavService
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
