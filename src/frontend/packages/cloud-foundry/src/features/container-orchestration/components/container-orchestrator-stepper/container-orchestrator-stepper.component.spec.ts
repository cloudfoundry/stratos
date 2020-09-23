import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import { BaseTestModules } from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ContainerOrchestratorStepComponent } from './container-orchestrator-step/container-orchestrator-step.component';
import { ContainerOrchestratorStepperComponent } from './container-orchestrator-stepper.component';

describe('ContainerOrchestratorStepperComponent', () => {
  let component: ContainerOrchestratorStepperComponent;
  let fixture: ComponentFixture<ContainerOrchestratorStepperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContainerOrchestratorStepperComponent, ContainerOrchestratorStepComponent ],
      imports: [ ...BaseTestModules ],
      providers: [TabNavService]
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
