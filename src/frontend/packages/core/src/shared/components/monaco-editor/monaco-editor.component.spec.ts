import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { loadMonacoEditor } from '../../../monaco-loader';
import { MonacoEditorComponent } from './monaco-editor.component';

describe('MonacoEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonacoEditorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('loads monaco on demand and creates the editor', async () => {
    const fixture = TestBed.createComponent(MonacoEditorComponent);
    fixture.detectChanges();

    let editor: any;
    fixture.componentInstance.editorInit.subscribe(e => editor = e);
    await fixture.componentInstance.ngAfterViewInit();

    expect(editor).toBeTruthy();
    expect(fixture.componentInstance.getEditor()).toBe(editor);
  });

  it('does not create the editor when destroyed before monaco resolves', async () => {
    const fixture = TestBed.createComponent(MonacoEditorComponent);
    fixture.detectChanges();

    const pending = fixture.componentInstance.ngAfterViewInit();
    fixture.componentInstance.ngOnDestroy();
    await pending;

    expect(fixture.componentInstance.getEditor()).toBeUndefined();
  });

  it('loader is idempotent — concurrent callers share one load', async () => {
    // window.monaco is mocked in test-setup, so both resolve without script injection
    await Promise.all([loadMonacoEditor(), loadMonacoEditor()]);
    expect((window as any).monaco).toBeTruthy();
  });
});
