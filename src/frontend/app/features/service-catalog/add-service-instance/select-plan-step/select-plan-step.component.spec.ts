import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
import { SelectPlanStepComponent } from './select-plan-step.component';

describe('SelectPlanStepComponent', () => {
  let component: SelectPlanStepComponent;
  let fixture: ComponentFixture<SelectPlanStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectPlanStepComponent],
      imports: [BaseTestModules],
      providers: [
        EntityServiceFactory,
        CreateServiceInstanceHelperService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPlanStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
