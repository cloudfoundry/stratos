import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StepperFormComponent } from './stepper-form.component';

describe('StepperFormComponent', () => {
  let component: StepperFormComponent;
  let fixture: ComponentFixture<StepperFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StepperFormComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StepperFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
