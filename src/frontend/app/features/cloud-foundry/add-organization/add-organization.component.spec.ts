import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { AddOrganizationComponent } from './add-organization.component';
import { CreateOrganizationStepComponent } from './create-organization-step/create-organization-step.component';

describe('AddOrganizationComponent', () => {
  let component: AddOrganizationComponent;
  let fixture: ComponentFixture<AddOrganizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddOrganizationComponent, CreateOrganizationStepComponent],
      imports: [...BaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
