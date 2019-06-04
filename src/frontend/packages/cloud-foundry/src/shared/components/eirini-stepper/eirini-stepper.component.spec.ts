import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EiriniStepperComponent } from './eirini-stepper.component';

describe('EiriniStepperComponent', () => {
  let component: EiriniStepperComponent;
  let fixture: ComponentFixture<EiriniStepperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EiriniStepperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EiriniStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
