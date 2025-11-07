import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule, MDAppModule, SharedModule, TabNavService } from '@stratosui/core';
import { generateTestApplicationServiceProvider } from "@test-framework/application-service-helper";
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CloudFoundrySharedModule } from '../../../shared/cf-shared.module';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from '../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { CliInfoApplicationComponent } from './cli-info-application.component';

describe('CliInfoApplicationComponent', () => {
  let component: CliInfoApplicationComponent;
  let fixture: ComponentFixture<CliInfoApplicationComponent>;

  const appId = '1';
  const cfId = '2';
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CliInfoApplicationComponent,
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        MDAppModule,
        RouterTestingModule,
        CloudFoundrySharedModule,
      ],
      providers: [
        
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CliInfoApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
