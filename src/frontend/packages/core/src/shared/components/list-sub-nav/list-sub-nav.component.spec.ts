import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ListSubNavAction, ListSubNavComponent } from './list-sub-nav.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupTestBed() {
  return TestBed.configureTestingModule({
    imports: [ListSubNavComponent],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
}

// ---------------------------------------------------------------------------
// Original / regression tests
// ---------------------------------------------------------------------------

describe('ListSubNavComponent — original behaviour', () => {
  let fixture: ComponentFixture<ListSubNavComponent>;
  let component: ListSubNavComponent;

  beforeEach(async () => {
    await setupTestBed();
    fixture = TestBed.createComponent(ListSubNavComponent);
    component = fixture.componentInstance;
  });

  function html(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders title with the count from the bound signal', () => {
    component.title = 'Total Routes';
    component.count = signal(12).asReadonly();
    fixture.detectChanges();

    const title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Routes');
    expect(title.textContent).toContain('12');
  });

  it('uses plural label form even when count is 0 or 1', () => {
    component.title = 'Total Endpoints';
    const c = signal(0);
    component.count = c.asReadonly();
    fixture.detectChanges();

    let title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Endpoints');
    expect(title.textContent).toContain('0');

    c.set(1);
    fixture.detectChanges();
    title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Endpoints');
    expect(title.textContent).toContain('1');
  });

  it('renders the add button when addAction is provided', () => {
    component.title = 'Total Routes';
    component.count = signal(0).asReadonly();
    component.addAction = {
      label: 'Add Route',
      invoke: () => undefined,
    };
    fixture.detectChanges();

    const btn = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toContain('Add Route');
    expect(btn!.disabled).toBe(false);
  });

  it('omits the add button entirely when addAction is undefined', () => {
    component.title = 'Total Events';
    component.count = signal(5).asReadonly();
    fixture.detectChanges();

    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeNull();
  });

  it('hides the add button while the visible signal returns false', () => {
    const visible = signal(false);
    component.title = 'Total Endpoints';
    component.count = signal(0).asReadonly();
    component.addAction = {
      label: 'Register Endpoint',
      invoke: () => undefined,
      visible: visible.asReadonly(),
    };
    fixture.detectChanges();

    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeNull();

    visible.set(true);
    fixture.detectChanges();
    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeTruthy();
  });

  it('disables the button while the disabled signal returns true', () => {
    const disabled = signal(true);
    component.title = 'Total Routes';
    component.count = signal(0).asReadonly();
    component.addAction = {
      label: 'Add Route',
      invoke: () => undefined,
      disabled: disabled.asReadonly(),
    };
    fixture.detectChanges();

    const btn = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    disabled.set(false);
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
  });

  it('invokes the action when the button is clicked', () => {
    let called = 0;
    component.title = 'Total Routes';
    component.count = signal(0).asReadonly();
    component.addAction = {
      label: 'Add Route',
      invoke: () => { called++; },
    };
    fixture.detectChanges();

    const btn = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement;
    btn.click();
    expect(called).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// New behaviour: actions + selectedCount
// ---------------------------------------------------------------------------

describe('ListSubNavComponent — action buttons', () => {
  let fixture: ComponentFixture<ListSubNavComponent>;
  let component: ListSubNavComponent;

  beforeEach(async () => {
    await setupTestBed();
    fixture = TestBed.createComponent(ListSubNavComponent);
    component = fixture.componentInstance;
    // Provide required inputs
    component.title = 'Total Users';
    component.count = signal(10).asReadonly();
  });

  function html(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  // ── Test 1: renders visible actions, hides invisible ones ─────────────────
  it('renders one button per visible action; an action with visible() === false is NOT rendered', () => {
    const visibleAction: ListSubNavAction = {
      label: 'Edit',
      invoke: () => undefined,
      dataTest: 'action-edit',
    };
    const hiddenAction: ListSubNavAction = {
      label: 'Delete',
      invoke: () => undefined,
      visible: signal(false).asReadonly(),
      dataTest: 'action-delete',
    };
    component.actions = [visibleAction, hiddenAction];
    fixture.detectChanges();

    expect(html().querySelector('[data-test="action-edit"]')).toBeTruthy();
    expect(html().querySelector('[data-test="action-delete"]')).toBeNull();
  });

  // ── Test 2: variant classes ───────────────────────────────────────────────
  it('applies red classes for destructive, bg-primary for primary, and border classes for default', () => {
    component.actions = [
      { label: 'Remove', invoke: () => undefined, variant: 'destructive', dataTest: 'btn-destructive' },
      { label: 'Save',   invoke: () => undefined, variant: 'primary',     dataTest: 'btn-primary' },
      { label: 'More',   invoke: () => undefined, variant: 'default',     dataTest: 'btn-default' },
    ];
    fixture.detectChanges();

    const destructiveBtn = html().querySelector('[data-test="btn-destructive"]') as HTMLButtonElement;
    const primaryBtn     = html().querySelector('[data-test="btn-primary"]')     as HTMLButtonElement;
    const defaultBtn     = html().querySelector('[data-test="btn-default"]')     as HTMLButtonElement;

    expect(destructiveBtn.className).toContain('bg-red-600');
    expect(primaryBtn.className).toContain('bg-primary');
    expect(defaultBtn.className).toContain('border');
    // default should NOT have red background
    expect(defaultBtn.className).not.toContain('bg-red-600');
    expect(defaultBtn.className).not.toContain('bg-primary');
  });

  // ── Test 3: disabled + title logic ───────────────────────────────────────
  it('disabled action has disabled attribute and title = disabledReason; enabled has tooltip or label', () => {
    component.actions = [
      {
        label: 'Remove',
        invoke: () => undefined,
        disabled: signal(true).asReadonly(),
        disabledReason: 'No permission',
        tooltip: 'Remove user',
        dataTest: 'btn-disabled',
      },
      {
        label: 'Edit',
        invoke: () => undefined,
        tooltip: 'Edit user',
        dataTest: 'btn-enabled',
      },
    ];
    fixture.detectChanges();

    const disabledBtn = html().querySelector('[data-test="btn-disabled"]') as HTMLButtonElement;
    const enabledBtn  = html().querySelector('[data-test="btn-enabled"]')  as HTMLButtonElement;

    expect(disabledBtn.disabled).toBe(true);
    expect(disabledBtn.title).toBe('No permission');

    expect(enabledBtn.disabled).toBe(false);
    expect(enabledBtn.title).toBe('Edit user');
  });

  // ── Test 3b: enabled without tooltip falls back to label ─────────────────
  it('enabled action with no tooltip uses label as title', () => {
    component.actions = [
      { label: 'Export', invoke: () => undefined, dataTest: 'btn-export' },
    ];
    fixture.detectChanges();

    const btn = html().querySelector('[data-test="btn-export"]') as HTMLButtonElement;
    expect(btn.title).toBe('Export');
  });

  // ── Test 4: clicking an enabled action calls its invoke ───────────────────
  it('clicking an enabled action calls its invoke', () => {
    const invoke = vi.fn();
    component.actions = [
      { label: 'Edit', invoke, dataTest: 'btn-invoke' },
    ];
    fixture.detectChanges();

    const btn = html().querySelector('[data-test="btn-invoke"]') as HTMLButtonElement;
    btn.click();

    expect(invoke).toHaveBeenCalledOnce();
  });

  // ── Test 5: selectedCount + Clear control ────────────────────────────────
  it('selectedCount() > 0 renders "N selected" + Clear control that calls onClearSelection', () => {
    const count = signal(3);
    const clearSpy = vi.fn();
    component.selectedCount = count.asReadonly();
    component.onClearSelection = clearSpy;
    fixture.detectChanges();

    const selectedEl = html().querySelector('[data-test="list-sub-nav-selected"]');
    expect(selectedEl).toBeTruthy();
    expect(selectedEl!.textContent).toContain('3');
    expect(selectedEl!.textContent).toContain('selected');

    const clearBtn = html().querySelector('[data-test="list-sub-nav-clear"]') as HTMLElement;
    expect(clearBtn).toBeTruthy();
    clearBtn.click();
    expect(clearSpy).toHaveBeenCalledOnce();
  });

  it('selectedCount() === 0 renders neither the selected group nor Clear', () => {
    component.selectedCount = signal(0).asReadonly();
    component.onClearSelection = vi.fn();
    fixture.detectChanges();

    expect(html().querySelector('[data-test="list-sub-nav-selected"]')).toBeNull();
    expect(html().querySelector('[data-test="list-sub-nav-clear"]')).toBeNull();
  });

  // ── Test 6: regression — addAction still renders alongside actions ────────
  it('existing addAction still renders (blue) and is unaffected when actions is also provided', () => {
    component.addAction = {
      label: 'Add User',
      invoke: () => undefined,
    };
    component.actions = [
      { label: 'Remove', invoke: () => undefined, variant: 'destructive', dataTest: 'btn-remove' },
    ];
    fixture.detectChanges();

    const addBtn    = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement;
    const removeBtn = html().querySelector('[data-test="btn-remove"]') as HTMLButtonElement;

    expect(addBtn).toBeTruthy();
    expect(addBtn.className).toContain('bg-primary');
    expect(removeBtn).toBeTruthy();
    expect(removeBtn.className).toContain('bg-red-600');
  });

  // ── Test 7: regression — no actions/selectedCount renders as before ───────
  it('with no actions or selectedCount, component renders title and count as before', () => {
    fixture.detectChanges();

    const title = html().querySelector('[data-test="list-sub-nav-title"]');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Total Users');
    expect(title!.textContent).toContain('10');

    // No selection group
    expect(html().querySelector('[data-test="list-sub-nav-selected"]')).toBeNull();
    // No action buttons beyond the add (which is absent here)
    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeNull();
  });
});
