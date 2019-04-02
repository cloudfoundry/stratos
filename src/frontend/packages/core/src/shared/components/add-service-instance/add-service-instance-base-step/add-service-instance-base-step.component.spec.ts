import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddServiceInstanceBaseStepComponent } from './add-service-instance-base-step.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('AddServiceInstanceBaseStepComponent', () => {
  let component: AddServiceInstanceBaseStepComponent;
  let fixture: ComponentFixture<AddServiceInstanceBaseStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: BaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
