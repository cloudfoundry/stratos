import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModules,
} from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseCF } from '../cf-page.types';
import { EditSpaceStepComponent } from './edit-space-step/edit-space-step.component';
import { EditSpaceComponent } from './edit-space.component';

describe('EditSpaceComponent', () => {
  let component: EditSpaceComponent;
  let fixture: ComponentFixture<EditSpaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditSpaceComponent, EditSpaceStepComponent],
      imports: [...getBaseTestModules],
      providers: [BaseCF, generateTestCfEndpointServiceProvider()]
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
