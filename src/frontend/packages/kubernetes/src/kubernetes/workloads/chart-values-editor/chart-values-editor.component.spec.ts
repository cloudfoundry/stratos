import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { MDAppModule } from '../../../../../core/src/public-api';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { MonacoEditorComponent } from '../../../../../core/src/shared/components/monaco-editor/monaco-editor.component';
import { ChartValuesEditorComponent } from './chart-values-editor.component';

const createEditorStub = (): MonacoEditorComponent => ({
  updateOptions: vi.fn(),
  layout: vi.fn(),
} as unknown as MonacoEditorComponent);

describe('ChartValuesEditorComponent', () => {
  let component: ChartValuesEditorComponent;
  let fixture: ComponentFixture<ChartValuesEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({providers: [

        HttpClient,
        HttpHandler,
        ConfirmationDialogService,

      provideZonelessChangeDetection(),
    ],
      imports: [
        MDAppModule,
        HttpClientModule,
        HttpClientTestingModule,
        createBasicStoreModule(),

        ChartValuesEditorComponent,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartValuesEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stores the editor and flags monaco as loaded on init', () => {
    const editor = createEditorStub();
    component.onMonacoInit(editor);
    expect(component.editor).toBe(editor);
    expect(component.model).toEqual({ language: 'yaml', uri: component.getSchemaUri() });
    expect(component['monacoLoaded']()).toBe(true);
  });

  it('sets the model only once across repeated inits', () => {
    component.onMonacoInit(createEditorStub());
    const model = component.model;
    const second = createEditorStub();
    component.onMonacoInit(second);
    expect(component.editor).toBe(second);
    expect(component.model).toBe(model);
  });

  it('forwards minimap and line number toggles to the editor', () => {
    // Before the editor exists the toggles only update local state
    component.toggleMinimap();
    expect(component.minimap).toBe(false);

    const editor = createEditorStub();
    component.onMonacoInit(editor);
    component.toggleMinimap();
    expect(editor.updateOptions).toHaveBeenCalledWith({ minimap: { enabled: true } });
    component.toggleLineNumbers();
    expect(editor.updateOptions).toHaveBeenCalledWith({ lineNumbers: 'off' });
  });
});
