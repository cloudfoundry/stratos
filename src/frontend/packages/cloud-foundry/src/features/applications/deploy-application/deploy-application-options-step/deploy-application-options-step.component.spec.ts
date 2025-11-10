import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';

import { generateCfTopLevelStoreEntities } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationEnvVarsHelper } from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step.component';

describe('DeployApplicationOptionsStepComponent', () => {
  let component: DeployApplicationOptionsStepComponent;
  let fixture: ComponentFixture<DeployApplicationOptionsStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeployApplicationOptionsStepComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore({
          initialState: {
            ...generateCfTopLevelStoreEntities()
          }
        }),
        ApplicationEnvVarsHelper,
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
