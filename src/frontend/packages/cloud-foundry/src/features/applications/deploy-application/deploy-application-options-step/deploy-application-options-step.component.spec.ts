import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationEnvVarsHelper } from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step.component';

describe('DeployApplicationOptionsStepComponent', () => {
  let component: DeployApplicationOptionsStepComponent;
  let fixture: ComponentFixture<DeployApplicationOptionsStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeployApplicationOptionsStepComponent],
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        ...generateCfStoreModules(),
        ApplicationEnvVarsHelper
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationOptionsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
