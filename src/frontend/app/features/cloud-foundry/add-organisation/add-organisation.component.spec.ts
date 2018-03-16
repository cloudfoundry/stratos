import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOrganisationComponent } from './add-organisation.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CreateOrganizationStepComponent } from './create-organization-step/create-organization-step.component';

describe('AddOrganisationComponent', () => {
  let component: AddOrganisationComponent;
  let fixture: ComponentFixture<AddOrganisationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddOrganisationComponent, CreateOrganizationStepComponent],
      imports: [...BaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOrganisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
