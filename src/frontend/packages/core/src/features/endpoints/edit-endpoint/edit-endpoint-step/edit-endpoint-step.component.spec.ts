import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOrganizationStepComponent } from './../../../../../../cloud-foundry/src/features/cloud-foundry/edit-organization/edit-organization-step/edit-organization-step.component';
import { ActiveRouteCfOrgSpace } from './../../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { generateCfBaseTestModules, generateTestCfEndpointServiceProvider } from '../../../../../../cloud-foundry/test-framework/cloud-foundry-endpoint-service.helper';

describe('EditOrganizationStepComponent', () => {
  let component: EditOrganizationStepComponent;
  let fixture: ComponentFixture<EditOrganizationStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditOrganizationStepComponent],
      imports: generateCfBaseTestModules(),
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
