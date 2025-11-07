import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {  provideExperimentalZonelessChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../../git/src/shared/github.helpers';
import { GitSCMService } from '../../../../../../git/src/shared/scm/scm.service';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ApplicationDeploySourceTypes } from '../deploy-application-steps.types';
import { DeployApplicationStep2Component } from "./deploy-application-step2.component";
describe('DeployApplicationStep2Component', () => {
  let component: DeployApplicationStep2Component;
  let fixture: ComponentFixture<DeployApplicationStep2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeployApplicationStep2Component],
      providers: [
        
        provideExperimentalZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([,
        provideZonelessChangeDetection(),
      ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...generateCfStoreModules(),
        GitSCMService,
        ApplicationDeploySourceTypes,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
