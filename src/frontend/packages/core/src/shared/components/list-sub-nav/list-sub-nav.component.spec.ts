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

  it('renders title with the count from the bound signal', async () => {
    fixture.componentRef.setInput('title', 'Total Routes');
    fixture.componentRef.setInput('count', signal(12).asReadonly());
    await fixture.whenStable();

    const title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Routes');
    expect(title.textContent).toContain('12');
  });

  it('uses plural label form even when count is 0 or 1', async () => {
    fixture.componentRef.setInput('title', 'Total Endpoints');
    const c = signal(0);
    fixture.componentRef.setInput('count', c.asReadonly());
    await fixture.whenStable();

    let title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Endpoints');
    expect(title.textContent).toContain('0');

    c.set(1);
    await fixture.whenStable();
    title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Endpoints');
    expect(title.textContent).toContain('1');
  });

  it('renders blinking pending dots instead of the count while loading() is true', async () => {
    fixture.componentRef.setInput('title', 'Total Users');
    fixture.componentRef.setInput('count', signal(0).asReadonly());
    const loading = signal(true);
    fixture.componentRef.setInput('loading', loading.asReadonly());
    await fixture.whenStable();

    let title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.querySelector('[data-test="count-pending"]')).toBeTruthy();
    expect(title.textContent).not.toContain('0');

    loading.set(false);
    await fixture.whenStable();
    title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('0');
    expect(title.querySelector('[data-test="count-pending"]')).toBeNull();
  });

  it('renders the add button when addAction is provided', async () => {
    fixture.componentRef.setInput('title', 'Total Routes');
    fixture.componentRef.setInput('count', signal(0).asReadonly());
    fixture.componentRef.setInput('addAction', {
      label: 'Add Route',
      invoke: () => undefined,
    });
    await fixture.whenStable();

    const btn = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toContain('Add Route');
    expect(btn!.disabled).toBe(false);
  });

  it('omits the add button entirely when addAction is undefined', async () => {
    fixture.componentRef.setInput('title', 'Total Events');
    fixture.componentRef.setInput('count', signal(5).asReadonly());
    await fixture.whenStable();

    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeNull();
  });

  it('hides the add button while the visible signal returns false', async () => {
    const visible = signal(false);
    fixture.componentRef.setInput('title', 'Total Endpoints');
    fixture.componentRef.setInput('count', signal(0).asReadonly());
    fixture.componentRef.setInput('addAction', {
      label: 'Register Endpoint',
      invoke: () => undefined,
      visible: visible.asReadonly(),
    });
    await fixture.whenStable();

    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeNull();

    visible.set(true);
    await fixture.whenStable();
    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeTruthy();
  });

  it('disables the button while the disabled signal returns true', async () => {
    const disabled = signal(true);
    fixture.componentRef.setInput('title', 'Total Routes');
    fixture.componentRef.setInput('count', signal(0).asReadonly());
    fixture.componentRef.setInput('addAction', {
      label: 'Add Route',
      invoke: () => undefined,
      disabled: disabled.asReadonly(),
    });
    await fixture.whenStable();

    const btn = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    disabled.set(false);
    await fixture.whenStable();
    expect(btn.disabled).toBe(false);
  });

  it('invokes the action when the button is clicked', async () => {
    let called = 0;
    fixture.componentRef.setInput('title', 'Total Routes');
    fixture.componentRef.setInput('count', signal(0).asReadonly());
    fixture.componentRef.setInput('addAction', {
      label: 'Add Route',
      invoke: () => { called++; },
    });
    await fixture.whenStable();

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
    fixture.componentRef.setInput('title', 'Total Users');
    fixture.componentRef.setInput('count', signal(10).asReadonly());
  });

  function html(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  // ── Test 1: renders visible actions, hides invisible ones ─────────────────
  it('renders one button per visible action; an action with visible() === false is NOT rendered', async () => {
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
    fixture.componentRef.setInput('actions', [visibleAction, hiddenAction]);
    await fixture.whenStable();

    expect(html().querySelector('[data-test="action-edit"]')).toBeTruthy();
    expect(html().querySelector('[data-test="action-delete"]')).toBeNull();
  });

  // ── Test 2: variant classes ───────────────────────────────────────────────
  it('applies red classes for destructive, bg-primary for primary, and border classes for default', async () => {
    fixture.componentRef.setInput('actions', [
      { label: 'Remove', invoke: () => undefined, variant: 'destructive', dataTest: 'btn-destructive' },
      { label: 'Save',   invoke: () => undefined, variant: 'primary',     dataTest: 'btn-primary' },
      { label: 'More',   invoke: () => undefined, variant: 'default',     dataTest: 'btn-default' },
    ]);
    await fixture.whenStable();

    const destructiveBtn = html().querySelector('[data-test="btn-destructive"]') as HTMLButtonElement;
    const primaryBtn     = html().querySelector('[data-test="btn-primary"]')     as HTMLButtonElement;
    const defaultBtn     = html().querySelector('[data-test="btn-default"]')     as HTMLButtonElement;

    expect(destructiveBtn.className).toContain('bg-danger');
    expect(primaryBtn.className).toContain('bg-primary');
    expect(defaultBtn.className).toContain('border');
    // default should NOT have danger background
    expect(defaultBtn.className).not.toContain('bg-danger');
    expect(defaultBtn.className).not.toContain('bg-primary');
  });

  // ── Test 3: disabled + title logic ───────────────────────────────────────
  it('disabled action has disabled attribute and title = disabledReason; enabled has tooltip or label', async () => {
    fixture.componentRef.setInput('actions', [
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
    ]);
    await fixture.whenStable();

    const disabledBtn = html().querySelector('[data-test="btn-disabled"]') as HTMLButtonElement;
    const enabledBtn  = html().querySelector('[data-test="btn-enabled"]')  as HTMLButtonElement;

    expect(disabledBtn.disabled).toBe(true);
    expect(disabledBtn.title).toBe('No permission');

    expect(enabledBtn.disabled).toBe(false);
    expect(enabledBtn.title).toBe('Edit user');
  });

  // ── Test 3b: enabled without tooltip falls back to label ─────────────────
  it('enabled action with no tooltip uses label as title', async () => {
    fixture.componentRef.setInput('actions', [
      { label: 'Export', invoke: () => undefined, dataTest: 'btn-export' },
    ]);
    await fixture.whenStable();

    const btn = html().querySelector('[data-test="btn-export"]') as HTMLButtonElement;
    expect(btn.title).toBe('Export');
  });

  // ── Test 4: clicking an enabled action calls its invoke ───────────────────
  it('clicking an enabled action calls its invoke', async () => {
    const invoke = vi.fn();
    fixture.componentRef.setInput('actions', [
      { label: 'Edit', invoke, dataTest: 'btn-invoke' },
    ]);
    await fixture.whenStable();

    const btn = html().querySelector('[data-test="btn-invoke"]') as HTMLButtonElement;
    btn.click();

    expect(invoke).toHaveBeenCalledOnce();
  });

  // ── Test 5: selectedCount + Clear control ────────────────────────────────
  it('selectedCount() > 0 renders "N selected" + Clear control that calls onClearSelection', async () => {
    const count = signal(3);
    const clearSpy = vi.fn();
    fixture.componentRef.setInput('selectedCount', count.asReadonly());
    fixture.componentRef.setInput('onClearSelection', clearSpy);
    await fixture.whenStable();

    const selectedEl = html().querySelector('[data-test="list-sub-nav-selected"]');
    expect(selectedEl).toBeTruthy();
    expect(selectedEl!.textContent).toContain('3');
    expect(selectedEl!.textContent).toContain('selected');

    const clearBtn = html().querySelector('[data-test="list-sub-nav-clear"]') as HTMLElement;
    expect(clearBtn).toBeTruthy();
    clearBtn.click();
    expect(clearSpy).toHaveBeenCalledOnce();
  });

  it('selectedCount() === 0 renders neither the selected group nor Clear', async () => {
    fixture.componentRef.setInput('selectedCount', signal(0).asReadonly());
    fixture.componentRef.setInput('onClearSelection', vi.fn());
    await fixture.whenStable();

    expect(html().querySelector('[data-test="list-sub-nav-selected"]')).toBeNull();
    expect(html().querySelector('[data-test="list-sub-nav-clear"]')).toBeNull();
  });

  // ── Test 6: regression — addAction still renders alongside actions ────────
  it('existing addAction still renders (blue) and is unaffected when actions is also provided', async () => {
    fixture.componentRef.setInput('addAction', {
      label: 'Add User',
      invoke: () => undefined,
    });
    fixture.componentRef.setInput('actions', [
      { label: 'Remove', invoke: () => undefined, variant: 'destructive', dataTest: 'btn-remove' },
    ]);
    await fixture.whenStable();

    const addBtn    = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement;
    const removeBtn = html().querySelector('[data-test="btn-remove"]') as HTMLButtonElement;

    expect(addBtn).toBeTruthy();
    expect(addBtn.className).toContain('bg-primary');
    expect(removeBtn).toBeTruthy();
    expect(removeBtn.className).toContain('bg-danger');
  });

  // ── Test 7: regression — no actions/selectedCount renders as before ───────
  it('with no actions or selectedCount, component renders title and count as before', async () => {
    await fixture.whenStable();

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
