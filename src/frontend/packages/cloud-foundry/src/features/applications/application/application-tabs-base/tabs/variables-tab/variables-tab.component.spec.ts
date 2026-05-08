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

  describe('validateAndSave()', () => {
    beforeEach(() => {
      // The data source's addItem is the model the form binds to. Stub it
      // so validateAndSave can read .name without dragging in the full
      // legacy paginator pipeline.
      (component.envVarsDataSource as any).addItem = { name: '', value: '' };
    });

    it('flags Name is required when the name is empty', () => {
      (component.envVarsDataSource as any).addItem.name = '';
      component.validateAndSave();
      expect(component.nameError()).toBe('Name is required');
    });

    it('flags Name is required when the name is whitespace-only', () => {
      (component.envVarsDataSource as any).addItem.name = '   ';
      component.validateAndSave();
      expect(component.nameError()).toBe('Name is required');
    });

    it('flags an invalid pattern when the name contains spaces', () => {
      (component.envVarsDataSource as any).addItem.name = 'bad name';
      component.validateAndSave();
      expect(component.nameError()).toMatch(/letters, digits, and underscores/i);
    });

    it('flags an invalid pattern when the name starts with a digit', () => {
      (component.envVarsDataSource as any).addItem.name = '1FOO';
      component.validateAndSave();
      expect(component.nameError()).toMatch(/letters, digits, and underscores/i);
    });

    it('accepts a valid name and clears any prior error', () => {
      component.nameError.set('Name is required');
      (component.envVarsDataSource as any).addItem.name = 'MY_VAR';
      // The legacy data source's saveAdd dispatches ngrx actions; stub it
      // so the test stays scoped to validation behavior.
      (component.envVarsDataSource as any).saveAdd = () => undefined;
      component.validateAndSave();
      expect(component.nameError()).toBe('');
    });
  });

  describe('clearNameError()', () => {
    it('resets the error signal when called', () => {
      component.nameError.set('Name is required');
      component.clearNameError();
      expect(component.nameError()).toBe('');
    });
  });
});
