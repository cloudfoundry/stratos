import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  BaseTestModules,
} from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EditOrganizationStepComponent } from './edit-organization-step/edit-organization-step.component';
import { EditOrganizationComponent } from './edit-organization.component';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

describe('EditOrganizationComponent', () => {
  let component: EditOrganizationComponent;
  let fixture: ComponentFixture<EditOrganizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditOrganizationComponent, EditOrganizationStepComponent],
      imports: [...BaseTestModules],
      providers: [ActiveRouteCfOrgSpace, generateTestCfEndpointServiceProvider()]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
