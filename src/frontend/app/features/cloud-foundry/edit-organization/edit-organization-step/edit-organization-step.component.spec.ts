import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModules,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseCF } from '../../cf-page.types';
import { EditOrganizationStepComponent } from './edit-organization-step.component';

describe('EditOrganizationStepComponent', () => {
  let component: EditOrganizationStepComponent;
  let fixture: ComponentFixture<EditOrganizationStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditOrganizationStepComponent],
      imports: [...getBaseTestModules],
      providers: [BaseCF, generateTestCfEndpointServiceProvider()]
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
