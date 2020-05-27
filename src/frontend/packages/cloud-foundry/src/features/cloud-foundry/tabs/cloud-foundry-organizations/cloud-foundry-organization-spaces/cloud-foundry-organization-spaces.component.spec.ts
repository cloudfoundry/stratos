import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../core/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../test-framework/cloud-foundry-organization.service.mock';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CloudFoundryOrganizationSpacesComponent } from './cloud-foundry-organization-spaces.component';

describe('CloudFoundryOrganizationSpacesComponent', () => {
  let component: CloudFoundryOrganizationSpacesComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSpacesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationSpacesComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationSpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
