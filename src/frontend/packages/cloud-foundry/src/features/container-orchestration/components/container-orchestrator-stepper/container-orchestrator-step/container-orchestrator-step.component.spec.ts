import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ContainerOrchestratorStepComponent } from './container-orchestrator-step.component';

describe('ContainerOrchestratorStepComponent', () => {
  let component: ContainerOrchestratorStepComponent;
  let fixture: ComponentFixture<ContainerOrchestratorStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContainerOrchestratorStepComponent ],
      imports: [ ...BaseTestModules ]
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
