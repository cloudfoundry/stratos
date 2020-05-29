import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';
import { EditSpaceStepComponent } from './edit-space-step/edit-space-step.component';
import { EditSpaceComponent } from './edit-space.component';

describe('EditSpaceComponent', () => {
  let component: EditSpaceComponent;
  let fixture: ComponentFixture<EditSpaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditSpaceComponent, EditSpaceStepComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        ActiveRouteCfOrgSpace,
        generateTestCfEndpointServiceProvider(),
        TabNavService,
        CloudFoundryOrganizationService,
        CloudFoundryUserProvidedServicesService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
