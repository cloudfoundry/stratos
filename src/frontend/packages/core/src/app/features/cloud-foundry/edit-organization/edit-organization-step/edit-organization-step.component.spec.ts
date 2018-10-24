import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  BaseTestModules,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EditOrganizationStepComponent } from './edit-organization-step.component';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

describe('EditOrganizationStepComponent', () => {
  let component: EditOrganizationStepComponent;
  let fixture: ComponentFixture<EditOrganizationStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditOrganizationStepComponent],
      imports: [...BaseTestModules],
      providers: [ActiveRouteCfOrgSpace, generateTestCfEndpointServiceProvider()]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOrganizationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
