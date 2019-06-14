import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerOrchestratorStepperComponent } from './container-orchestrator-stepper.component';

describe('ContainerOrchestratorStepperComponent', () => {
  let component: ContainerOrchestratorStepperComponent;
  let fixture: ComponentFixture<ContainerOrchestratorStepperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContainerOrchestratorStepperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerOrchestratorStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
