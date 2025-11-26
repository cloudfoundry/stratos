import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateTestApplicationServiceProvider, ApplicationStateService, ApplicationEnvVarsHelper, generateCfStoreModules } from '@test-framework/cf';
import { ConfirmationDialogService } from '@stratosui/core';
import { VariablesTabComponent } from './variables-tab.component';

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
});
