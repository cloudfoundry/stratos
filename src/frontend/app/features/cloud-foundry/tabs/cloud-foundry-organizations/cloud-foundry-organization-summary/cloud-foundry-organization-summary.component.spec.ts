import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModules,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationServiceMock } from '../../../../../test-framework/cloud-foundry-organisation.service.mock';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organisation.service';
import { CloudFoundryOrganizationSummaryComponent } from './cloud-foundry-organization-summary.component';

describe('CloudFoundryOrganizationSummaryComponent', () => {
  let component: CloudFoundryOrganizationSummaryComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationSummaryComponent],
      imports: [...getBaseTestModules],
      providers: [
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        generateTestCfEndpointServiceProvider()
      ]
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
