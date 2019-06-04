import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfSchedulerStepComponent } from './cf-scheduler-step.component';

describe('CfSchedulerStepComponent', () => {
  let component: CfSchedulerStepComponent;
  let fixture: ComponentFixture<CfSchedulerStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CfSchedulerStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfSchedulerStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
