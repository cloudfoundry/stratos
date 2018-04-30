import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectPlanStepComponent } from './select-plan-step.component';
import { ServicesService } from '../../services.service';
import { ServicesServiceMock } from '../../services.service.mock';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('SelectPlanStepComponent', () => {
  let component: SelectPlanStepComponent;
  let fixture: ComponentFixture<SelectPlanStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectPlanStepComponent],
      imports: [BaseTestModules],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
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
