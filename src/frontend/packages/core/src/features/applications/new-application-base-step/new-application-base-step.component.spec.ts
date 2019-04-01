import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewApplicationBaseStepComponent } from './new-application-base-step.component';

describe('NewApplicationBaseStepComponent', () => {
  let component: NewApplicationBaseStepComponent;
  let fixture: ComponentFixture<NewApplicationBaseStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewApplicationBaseStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewApplicationBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
