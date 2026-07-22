import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VariableEditDialogComponent, VariableEditDialogData } from './variable-edit-dialog.component';

function make(data: VariableEditDialogData) {
  const close = vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: TailwindDialogRef, useValue: { close } },
    ],
  });
  // createComponent (no detectChanges) runs the constructor — initializing
  // the signals from MAT_DIALOG_DATA — without rendering the Monaco editor.
  const fixture = TestBed.createComponent(VariableEditDialogComponent);
  return { cmp: fixture.componentInstance, close };
}

describe('VariableEditDialogComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // -------------------------------------------------------------------------
  // Initialization from dialog data
  // -------------------------------------------------------------------------

  it('initializes name and value from the dialog data', () => {
    const { cmp } = make({ mode: 'edit', name: 'FOO', value: 'bar' });
    expect(cmp.name()).toBe('FOO');
    expect(cmp.value()).toBe('bar');
  });

  it('defaults to empty name/value in add mode', () => {
    const { cmp } = make({ mode: 'add' });
    expect(cmp.name()).toBe('');
    expect(cmp.value()).toBe('');
  });

  it('uses an enlarged Monaco font size for readability', () => {
    const { cmp } = make({ mode: 'add' });
    expect(cmp.editorOptions.fontSize).toBeGreaterThanOrEqual(16);
  });

  it('auto-detects JSON mode for an object value', () => {
    const { cmp } = make({ mode: 'edit', name: 'STRATOS_PROJECT', value: '{"deploy":true}' });
    expect(cmp.jsonMode()).toBe(true);
  });

  it('stays in plain mode for a non-JSON value', () => {
    const { cmp } = make({ mode: 'edit', name: 'ENV', value: 'production' });
    expect(cmp.jsonMode()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // canSave gating
  // -------------------------------------------------------------------------

  it('blocks Save when the name is empty', () => {
    const { cmp } = make({ mode: 'add' });
    expect(cmp.canSave()).toBe(false);
  });

  it('blocks Save on a duplicate name (existingNames excludes self)', () => {
    const { cmp } = make({ mode: 'add', existingNames: ['TAKEN'] });
    cmp.name.set('TAKEN');
    expect(cmp.canSave()).toBe(false);
    expect(cmp.nameError()).toMatch(/in use/i);
  });

  it('does not surface the name error on a fresh create dialog (untouched), but still blocks Save', () => {
    const { cmp } = make({ mode: 'add' });
    expect(cmp.nameTouched()).toBe(false);
    expect(cmp.nameError()).toMatch(/required/i); // validation still fails internally
    expect(cmp.visibleNameError()).toBeNull();    // ...but nothing is shown yet
    expect(cmp.canSave()).toBe(false);            // ...and Save stays disabled
  });

  it('surfaces the name error once the field is touched', () => {
    const { cmp } = make({ mode: 'add' });
    cmp.nameTouched.set(true);
    expect(cmp.visibleNameError()).toMatch(/required/i);
  });

  it('allows Save (with a warning) on a shell-unsafe but CF-valid name', () => {
    const { cmp } = make({ mode: 'add' });
    cmp.name.set('my-var');
    expect(cmp.canSave()).toBe(true);
    expect(cmp.nameWarning()).toMatch(/shell/i);
  });

  it('allows Save on a clean name with no warning', () => {
    const { cmp } = make({ mode: 'add' });
    cmp.name.set('CLEAN_NAME');
    expect(cmp.canSave()).toBe(true);
    expect(cmp.nameWarning()).toBeNull();
  });

  // -------------------------------------------------------------------------
  // JSON-mode warning (warn but allow)
  // -------------------------------------------------------------------------

  it('surfaces a JSON warning only while in JSON mode', () => {
    const { cmp } = make({ mode: 'edit', name: 'X', value: 'not json' });
    expect(cmp.jsonMode()).toBe(false);
    expect(cmp.jsonWarning()).toBeNull();

    cmp.toggleJsonMode();
    expect(cmp.jsonMode()).toBe(true);
    expect(cmp.jsonWarning()).toMatch(/json/i);
    expect(cmp.canSave()).toBe(true); // warn, never block
  });

  // -------------------------------------------------------------------------
  // save / cancel
  // -------------------------------------------------------------------------

  it('save() closes with the trimmed name and verbatim value when allowed', () => {
    const { cmp, close } = make({ mode: 'add' });
    cmp.name.set('  NEW  ');
    cmp.value.set('  spaced value  ');
    cmp.save();
    expect(close).toHaveBeenCalledWith({ name: 'NEW', value: '  spaced value  ' });
  });

  it('minifies a valid-JSON value on save (always stored compact)', () => {
    const { cmp, close } = make({ mode: 'add' });
    cmp.name.set('CFG');
    cmp.value.set('{\n  "a": 1,\n  "b": [2, 3]\n}');
    cmp.save();
    expect(close).toHaveBeenCalledWith({ name: 'CFG', value: '{"a":1,"b":[2,3]}' });
  });

  it('stores a non-JSON value verbatim (no minify attempt)', () => {
    const { cmp, close } = make({ mode: 'add' });
    cmp.name.set('MSG');
    cmp.value.set('hello world');
    cmp.save();
    expect(close).toHaveBeenCalledWith({ name: 'MSG', value: 'hello world' });
  });

  it('stores an empty value as "" (never null, never minified away)', () => {
    const { cmp, close } = make({ mode: 'add' });
    cmp.name.set('EMPTY');
    cmp.value.set('');
    cmp.save();
    expect(close).toHaveBeenCalledWith({ name: 'EMPTY', value: '' });
  });

  // -------------------------------------------------------------------------
  // Format button — pretty-print JSON in place (editing aid only)
  // -------------------------------------------------------------------------

  it('toggleFormat() pretty-prints minified JSON to 2-space indentation', () => {
    const { cmp } = make({ mode: 'edit', name: 'CFG', value: '{"a":1}' });
    expect(cmp.jsonMode()).toBe(true);
    expect(cmp.isMinified()).toBe(true); // button reads "Format"
    cmp.toggleFormat();
    expect(cmp.value()).toBe('{\n  "a": 1\n}');
  });

  it('toggleFormat() minifies pretty-printed JSON (round-trips back)', () => {
    const { cmp } = make({ mode: 'edit', name: 'CFG', value: '{\n  "a": 1\n}' });
    expect(cmp.isMinified()).toBe(false); // button reads "Minify"
    cmp.toggleFormat();
    expect(cmp.value()).toBe('{"a":1}');
    expect(cmp.isMinified()).toBe(true);
    cmp.toggleFormat(); // and back to pretty
    expect(cmp.value()).toBe('{\n  "a": 1\n}');
  });

  it('formatting then saving stores the SAME minified value as saving directly', () => {
    const direct = make({ mode: 'add' });
    direct.cmp.name.set('CFG');
    direct.cmp.value.set('{"a":1,"b":[2,3]}');
    direct.cmp.save();

    const formatted = make({ mode: 'add' });
    formatted.cmp.name.set('CFG');
    formatted.cmp.value.set('{"a":1,"b":[2,3]}');
    formatted.cmp.toggleFormat(); // expand for readability
    formatted.cmp.save();

    // Toggling changed the editor text, but the persisted value is identical.
    expect(formatted.close.mock.calls[0][0]).toEqual(direct.close.mock.calls[0][0]);
  });

  it('toggleFormat() is a no-op on invalid JSON', () => {
    const { cmp } = make({ mode: 'edit', name: 'X', value: 'not json' });
    cmp.toggleJsonMode(); // into JSON mode
    cmp.toggleFormat();
    expect(cmp.value()).toBe('not json');
  });

  it('canFormat is true only in JSON mode with valid JSON', () => {
    const { cmp } = make({ mode: 'edit', name: 'CFG', value: '{"a":1}' });
    expect(cmp.canFormat()).toBe(true);
    cmp.toggleJsonMode(); // -> plain mode
    expect(cmp.canFormat()).toBe(false);
  });

  it('save() is a no-op when Save is blocked', () => {
    const { cmp, close } = make({ mode: 'add' });
    cmp.name.set(''); // blocked
    cmp.save();
    expect(close).not.toHaveBeenCalled();
  });

  it('cancel() closes with no result', () => {
    const { cmp, close } = make({ mode: 'edit', name: 'FOO', value: 'bar' });
    cmp.cancel();
    expect(close).toHaveBeenCalledWith();
  });

  // -------------------------------------------------------------------------
  // rename detection is the consumer's job — dialog just returns {name,value}
  // -------------------------------------------------------------------------

  it('returns the edited name even when changed (rename routing left to caller)', () => {
    const { cmp, close } = make({ mode: 'edit', name: 'OLD', value: 'v', existingNames: [] });
    cmp.name.set('RENAMED');
    cmp.save();
    expect(close).toHaveBeenCalledWith({ name: 'RENAMED', value: 'v' });
  });
});
