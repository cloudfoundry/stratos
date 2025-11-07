import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '@stratosui/core';
import { ApplicationStateService } from '@stratosui/shared';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ApplicationBaseComponent } from './application-base.component';
import { ApplicationEnvVarsHelper } from "./application-tabs-base/tabs/build-tab/application-env-vars.service";
describe('ApplicationBaseComponent', () => {
  let component: ApplicationBaseComponent;
  let fixture: ComponentFixture<ApplicationBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplicationBaseComponent,
        CoreModule,
        RouterTestingModule,
        generateCfStoreModules(),
      ],
      providers: [
        
        ApplicationStateService,
        ApplicationEnvVarsHelper,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
