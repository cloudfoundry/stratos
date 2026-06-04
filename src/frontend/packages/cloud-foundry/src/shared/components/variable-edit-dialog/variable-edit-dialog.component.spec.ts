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
