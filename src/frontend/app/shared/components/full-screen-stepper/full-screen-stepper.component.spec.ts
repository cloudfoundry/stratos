import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FullScreenStepperComponent } from './full-screen-stepper.component';

describe('FullScreenStepperComponent', () => {
  let component: FullScreenStepperComponent;
  let fixture: ComponentFixture<FullScreenStepperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FullScreenStepperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FullScreenStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
