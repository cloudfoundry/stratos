import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { getBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationSummaryComponent } from './cloud-foundry-organization-summary.component';

describe('CloudFoundryOrganizationSummaryComponent', () => {
  let component: CloudFoundryOrganizationSummaryComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationSummaryComponent],
      imports: [...getBaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
