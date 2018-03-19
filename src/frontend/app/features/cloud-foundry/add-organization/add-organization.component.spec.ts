import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOrganizationComponent } from './add-organization.component';
import { getBaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CreateOrganizationStepComponent } from './create-organization-step/create-organization-step.component';

describe('AddOrganizationComponent', () => {
  let component: AddOrganizationComponent;
  let fixture: ComponentFixture<AddOrganizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddOrganizationComponent, CreateOrganizationStepComponent],
      imports: [...getBaseTestModules]
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
