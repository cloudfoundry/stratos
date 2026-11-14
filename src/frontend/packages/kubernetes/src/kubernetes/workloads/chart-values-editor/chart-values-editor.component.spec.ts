import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
    await TestBed.configureTestingModule({
      providers: [
        ConfirmationDialogService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [
        MDAppModule,
        createBasicStoreModule(),
        ChartValuesEditorComponent,
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ChartValuesEditorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // Regression: `config` is applied from an effect, which runs during change
  // detection - outside any injection context. The monaco-loaded observable
  // must therefore be built as a field, not on that path, or init() throws
  // NG0203 before it ever requests the chart values and the editor sits on
  // "Loading ..." forever.
  it('requests the chart values when config arrives through the input', async () => {
    const http = TestBed.inject(HttpTestingController);

    fixture.componentRef.setInput('config', { valuesUrl: '/values.yaml', schemaUrl: null });
    await fixture.whenStable();

    expect(component.initing()).toBe(false);
    http.expectOne('/values.yaml').flush('replicas: 1\n');
  });

  // The template reads fields that the load stream writes, so the view has
  // to catch up once the schema, values and editor have all arrived.
  it('drops the loading overlay and offers the form once everything has loaded', async () => {
    const http = TestBed.inject(HttpTestingController);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Loading ...');

    fixture.componentRef.setInput('config', { valuesUrl: '/values.yaml', schemaUrl: '/schema.json' });
    await fixture.whenStable();
    expect(el.textContent).toContain('Loading ...');

    http.expectOne('/schema.json').flush({ type: 'object', properties: { replicas: { type: 'integer' } } });
    http.expectOne('/values.yaml').flush('replicas: 1\n');
    component.onMonacoInit(createEditorStub());
    await fixture.whenStable();

    expect(el.textContent).not.toContain('Loading ...');
    expect(el.querySelector('button[name="edit-mode-form"]')).not.toBeNull();
    expect(component.mode()).toBe('form');
  });

  it('shows the editor toggles once the YAML editor is picked', async () => {
    const http = TestBed.inject(HttpTestingController);
    const el: HTMLElement = fixture.nativeElement;
    fixture.componentRef.setInput('config', { valuesUrl: '/values.yaml', schemaUrl: '/schema.json' });
    await fixture.whenStable();
    http.expectOne('/schema.json').flush({ type: 'object', properties: { replicas: { type: 'integer' } } });
    http.expectOne('/values.yaml').flush('replicas: 1\n');
    component.onMonacoInit(createEditorStub());
    await fixture.whenStable();
    expect(el.querySelector('button[aria-label="Minimap"]')).toBeNull();

    el.querySelector<HTMLButtonElement>('button[name="edit-mode-editor"]')!.click();
    await fixture.whenStable();

    expect(component.mode()).toBe('editor');
    expect(el.querySelector('button[aria-label="Minimap"]')).not.toBeNull();
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
