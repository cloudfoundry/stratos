import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {  provideExperimentalZonelessChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationStepSourceUploadComponent } from "./deploy-application-step-source-upload.component";
describe('DeployApplicationStepSourceUploadComponent', () => {
  let component: DeployApplicationStepSourceUploadComponent;
  let fixture: ComponentFixture<DeployApplicationStepSourceUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeployApplicationStepSourceUploadComponent],
      providers: [
        
        provideExperimentalZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([,
        provideZonelessChangeDetection(),
      ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...generateCfStoreModules(),
        CfOrgSpaceDataService,
    ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationStepSourceUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
