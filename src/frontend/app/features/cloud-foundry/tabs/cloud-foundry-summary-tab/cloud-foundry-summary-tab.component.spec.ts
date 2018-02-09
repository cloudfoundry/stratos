import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySummaryTabComponent } from './cloud-foundry-summary-tab.component';
import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModules
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CloudFoundrySummaryTabComponent', () => {
  let component: CloudFoundrySummaryTabComponent;
  let fixture: ComponentFixture<CloudFoundrySummaryTabComponent>;
  const cfId = '1';
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundrySummaryTabComponent],
        imports: [...getBaseTestModules],
        providers: [generateTestCfEndpointServiceProvider(cfId)]
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
