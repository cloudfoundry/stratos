import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  BaseTestModules,
} from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EditSpaceStepComponent } from './edit-space-step/edit-space-step.component';
import { EditSpaceComponent } from './edit-space.component';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

describe('EditSpaceComponent', () => {
  let component: EditSpaceComponent;
  let fixture: ComponentFixture<EditSpaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditSpaceComponent, EditSpaceStepComponent],
      imports: [...BaseTestModules],
      providers: [ActiveRouteCfOrgSpace, generateTestCfEndpointServiceProvider()]
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
