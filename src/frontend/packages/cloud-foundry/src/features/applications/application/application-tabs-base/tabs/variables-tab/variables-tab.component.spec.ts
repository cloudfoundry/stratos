import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, NO_ERRORS_SCHEMA, signal, computed } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateTestApplicationServiceProvider, ApplicationStateService, ApplicationEnvVarsHelper, generateCfStoreModules } from '@test-framework/cf';
import { ConfirmationDialogService } from '@stratosui/core';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { VariablesTabComponent } from './variables-tab.component';

/** Minimal AppDetailDataService stub — only the signals used by VariablesTabComponent. */
const makeDataStub = () => ({
  app: signal<any>(undefined).asReadonly(),
});

describe('VariablesTabComponent', () => {
  let component: VariablesTabComponent;
  let fixture: ComponentFixture<VariablesTabComponent>;

  beforeEach(() => {
    const cfGuid = 'mockCfGuid';
    const appGuid = 'mockAppGuid';

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        generateTestApplicationServiceProvider(appGuid, cfGuid),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        ConfirmationDialogService,
        { provide: AppDetailDataService, useFactory: makeDataStub },
      ],
      imports: [
        VariablesTabComponent,
        ...generateCfStoreModules(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(VariablesTabComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    // Component is created successfully without triggering full initialization
    expect(component).toBeTruthy();
  });

  it('envVarNames returns empty array when app signal is undefined', () => {
    expect(component.envVarNames()).toEqual([]);
  });
});
