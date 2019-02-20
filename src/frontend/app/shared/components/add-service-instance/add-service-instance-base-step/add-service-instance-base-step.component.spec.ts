import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddServiceInstanceBaseStepComponent } from './add-service-instance-base-step.component';

describe('AddServiceInstanceBaseStepComponent', () => {
  let component: AddServiceInstanceBaseStepComponent;
  let fixture: ComponentFixture<AddServiceInstanceBaseStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddServiceInstanceBaseStepComponent ]
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
