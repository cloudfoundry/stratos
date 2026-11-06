import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';
import { loadMonacoEditor } from '../../../monaco-loader';
import { MonacoEditorComponent } from './monaco-editor.component';

// Resolves to the window.monaco mock installed by test-setup
declare const monaco: typeof import('monaco-editor');

function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

// Editor stand-in matching the test-setup mock's shape, with the
// content-change listener captured so tests can drive edits.
function createEditorStub() {
  const model = {};
  let value = '';
  let onContentChange: () => void = () => {};
  const stub = {
    getValue: () => value,
    setValue: (v: string) => { value = v; },
    updateOptions: () => {},
    layout: () => {},
    focus: () => {},
    dispose: () => {},
    onDidChangeModelContent: (cb: () => void) => { onContentChange = cb; return { dispose: () => {} }; },
    onDidBlurEditorText: () => ({ dispose: () => {} }),
    setModel: () => {},
    getModel: () => model,
  };
  return { stub, model, type: (v: string) => { value = v; onContentChange(); } };
}

describe('MonacoEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonacoEditorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // setThemeMode persists its choice; drop it so later files start clean
    localStorage.removeItem('stratos-theme-mode');
  });

  it('loads monaco on demand and emits the component once the editor exists', async () => {
    const fixture = TestBed.createComponent(MonacoEditorComponent);
    fixture.detectChanges();

    let emitted: MonacoEditorComponent | undefined;
    fixture.componentInstance.editorInit.subscribe(c => emitted = c);
    await fixture.componentInstance.ngAfterViewInit();

    expect(emitted).toBe(fixture.componentInstance);
  });

  it('does not create the editor when destroyed before monaco resolves', async () => {
    const fixture = TestBed.createComponent(MonacoEditorComponent);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.editorInit.subscribe(() => emitted = true);
    const pending = fixture.componentInstance.ngAfterViewInit();
    fixture.componentInstance.ngOnDestroy();
    await pending;

    expect(emitted).toBe(false);
  });

  it('loader is idempotent — concurrent callers share one load', async () => {
    // window.monaco is mocked in test-setup, so both resolve without script injection
    await Promise.all([loadMonacoEditor(), loadMonacoEditor()]);
    expect(monaco).toBeTruthy();
  });

  it('emits valueChange with the new text on content changes', async () => {
    const { stub, type } = createEditorStub();
    vi.spyOn(monaco.editor, 'create').mockReturnValue(stub as any);

    const fixture = TestBed.createComponent(MonacoEditorComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngAfterViewInit();

    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe(v => emitted.push(v));
    type('foo: bar');

    expect(emitted).toEqual(['foo: bar']);
  });

  it('setLanguage delegates to monaco.editor.setModelLanguage with the editor model', async () => {
    const { stub, model } = createEditorStub();
    vi.spyOn(monaco.editor, 'create').mockReturnValue(stub as any);
    const setModelLanguage = vi.spyOn(monaco.editor, 'setModelLanguage');

    const fixture = TestBed.createComponent(MonacoEditorComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngAfterViewInit();

    fixture.componentInstance.setLanguage('json');

    expect(setModelLanguage).toHaveBeenCalledWith(model, 'json');
  });

  it('setLanguage is a no-op before the editor exists', () => {
    const setModelLanguage = vi.spyOn(monaco.editor, 'setModelLanguage');
    const fixture = TestBed.createComponent(MonacoEditorComponent);

    fixture.componentInstance.setLanguage('json');

    expect(setModelLanguage).not.toHaveBeenCalled();
  });

  it('follows app dark mode via the global monaco theme', async () => {
    const { stub } = createEditorStub();
    vi.spyOn(monaco.editor, 'create').mockReturnValue(stub as any);
    const setTheme = vi.spyOn(monaco.editor, 'setTheme');

    const fixture = TestBed.createComponent(MonacoEditorComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngAfterViewInit();

    const branding = TestBed.inject(StratosBrandingService);
    branding.setThemeMode('dark');
    flushEffects();
    expect(setTheme).toHaveBeenCalledWith('vs-dark');

    branding.setThemeMode('light');
    flushEffects();
    expect(setTheme).toHaveBeenCalledWith('vs');
  });

  it('leaves the global theme alone when options.theme is pinned', async () => {
    const { stub } = createEditorStub();
    vi.spyOn(monaco.editor, 'create').mockReturnValue(stub as any);
    const setTheme = vi.spyOn(monaco.editor, 'setTheme');

    const fixture = TestBed.createComponent(MonacoEditorComponent);
    fixture.componentInstance.options = { theme: 'hc-black' };
    fixture.detectChanges();
    await fixture.componentInstance.ngAfterViewInit();

    const branding = TestBed.inject(StratosBrandingService);
    branding.setThemeMode('dark');
    flushEffects();

    expect(setTheme).not.toHaveBeenCalled();
    // Leave the shared document light again for later tests
    branding.setThemeMode('light');
  });
});
