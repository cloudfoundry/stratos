import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { getBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganisationServiceMock } from '../../../../../test-framework/cloud-foundry-organisation.service.mock';
import { CloudFoundryOrganisationService } from '../../../services/cloud-foundry-organisation.service';
import { CloudFoundryOrganizationSpacesComponent } from './cloud-foundry-organization-spaces.component';

describe('CloudFoundryOrganizationSpacesComponent', () => {
  let component: CloudFoundryOrganizationSpacesComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSpacesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationSpacesComponent],
      imports: [...getBaseTestModules],
      providers: [
        { provide: CloudFoundryOrganisationService, useClass: CloudFoundryOrganisationServiceMock }
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
