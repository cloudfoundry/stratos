import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySummaryTabComponent } from './cloud-foundry-summary-tab.component';
import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModules
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { testSCFGuid } from '../../../../test-framework/store-test-helper';

describe('CloudFoundrySummaryTabComponent', () => {
  let component: CloudFoundrySummaryTabComponent;
  let fixture: ComponentFixture<CloudFoundrySummaryTabComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundrySummaryTabComponent],
        imports: [...getBaseTestModules],
        providers: [generateTestCfEndpointServiceProvider()]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
