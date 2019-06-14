import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerOrchestratorStepComponent } from './container-orchestrator-step.component';

describe('ContainerOrchestratorStepComponent', () => {
  let component: ContainerOrchestratorStepComponent;
  let fixture: ComponentFixture<ContainerOrchestratorStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContainerOrchestratorStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerOrchestratorStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
