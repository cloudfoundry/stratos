import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../core/tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySummaryTabComponent } from './cloud-foundry-summary-tab.component';

describe('CloudFoundrySummaryTabComponent', () => {
  let component: CloudFoundrySummaryTabComponent;
  let fixture: ComponentFixture<CloudFoundrySummaryTabComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundrySummaryTabComponent],
        imports: [...BaseTestModules],
        providers: [...generateTestCfEndpointServiceProvider(), TabNavService]
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

