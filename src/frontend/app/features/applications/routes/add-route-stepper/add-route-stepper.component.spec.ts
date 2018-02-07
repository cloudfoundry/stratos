import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRouteStepperComponent } from './add-route-stepper.component';

describe('AddRouteStepperComponent', () => {
  let component: AddRouteStepperComponent;
  let fixture: ComponentFixture<AddRouteStepperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddRouteStepperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRouteStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
