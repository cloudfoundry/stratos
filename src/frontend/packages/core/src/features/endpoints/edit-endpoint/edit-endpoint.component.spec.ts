import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveRouteCfOrgSpace } from './../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { EditOrganizationStepComponent } from './../../../../../cloud-foundry/src/features/cloud-foundry/edit-organization/edit-organization-step/edit-organization-step.component';
import { EditOrganizationComponent } from './../../../../../cloud-foundry/src/features/cloud-foundry/edit-organization/edit-organization.component';
import { generateCfBaseTestModules, generateTestCfEndpointServiceProvider } from '../../../../../cloud-foundry/test-framework/cloud-foundry-endpoint-service.helper';

import { TabNavService } from '../../../../tab-nav.service';

describe('EditOrganizationComponent', () => {
  let component: EditOrganizationComponent;
  let fixture: ComponentFixture<EditOrganizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditOrganizationComponent, EditOrganizationStepComponent],
      imports: generateCfBaseTestModules(),
      providers: [ActiveRouteCfOrgSpace, generateTestCfEndpointServiceProvider(), TabNavService]

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
