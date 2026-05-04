import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SignalDetailComponent } from './signal-detail.component';
import type { SignalDetailConfig } from './signal-detail.component';

@Component({
  standalone: true,
  imports: [SignalDetailComponent],
  template: `<app-signal-detail [config]="config"><div data-test="body-content">Body</div></app-signal-detail>`
})
class Host {
  config: SignalDetailConfig = {};
}

function setup(partial: Partial<SignalDetailConfig>) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.config = { ...partial };
  fixture.detectChanges();
  return fixture;
}

describe('SignalDetailComponent', () => {
  it('skips the toolbar row when no breadcrumbs / status / actions are configured', () => {
    const fixture = setup({});
    expect(fixture.nativeElement.querySelector('[data-test="signal-detail-toolbar"]')).toBeNull();
  });

  it('renders breadcrumbs with chevron separators between entries', () => {
    const fixture = setup({
      breadcrumbs: signal([
        { label: 'Cloud Foundry', link: ['/cf'] },
        { label: 'org-1', link: ['/cf', 'org-1'] },
        { label: 'space-a' },
      ]).asReadonly(),
    });
    const crumbs = fixture.nativeElement.querySelectorAll('.signal-detail-breadcrumb');
    expect(crumbs.length).toBe(3);
    expect(crumbs[0].tagName.toLowerCase()).toBe('a');
    expect(crumbs[1].tagName.toLowerCase()).toBe('a');
    // Last crumb has no link → rendered as <span>.
    expect(crumbs[2].tagName.toLowerCase()).toBe('span');
    expect(crumbs[2].textContent).toContain('space-a');
    // 3 crumbs → 2 chevron separators.
    const chevrons = fixture.nativeElement.querySelectorAll('[data-test="signal-detail-breadcrumbs"] .material-icons');
    expect(chevrons.length).toBe(2);
  });

  it('renders a status pill with the color-coded class', () => {
    const fixture = setup({
      status: signal({ label: 'Running', color: 'success' as const }).asReadonly(),
    });
    const pill = fixture.nativeElement.querySelector('[data-test="signal-detail-status"]');
    expect(pill).not.toBeNull();
    expect(pill.textContent).toContain('Running');
    expect(pill.className).toContain('bg-success-shade-100');
  });

  it('renders default neutral pill when status color is omitted', () => {
    const fixture = setup({
      status: signal({ label: 'Unknown' }).asReadonly(),
    });
    const pill = fixture.nativeElement.querySelector('[data-test="signal-detail-status"]');
    expect(pill.className).toContain('bg-gray-100');
  });

  it('renders header action buttons with optional icon, primary emphasis class', () => {
    const fixture = setup({
      headerActions: [
        { label: 'Edit', icon: 'edit', invoke: () => { /* no-op */ } },
        { label: 'Delete', primary: true, invoke: () => { /* no-op */ } },
      ],
    });
    const btns = fixture.nativeElement.querySelectorAll('[data-test="signal-detail-header-action"]');
    expect(btns.length).toBe(2);
    expect(btns[0].textContent).toContain('Edit');
    expect(btns[0].querySelector('.material-icons')?.textContent).toBe('edit');
    expect(btns[1].className).toContain('bg-accent');
    expect(btns[0].className).not.toContain('bg-accent ');
  });

  it('hides actions whose visible signal returns false; reactive flip restores them', () => {
    const visible = signal(false);
    const fixture = setup({
      headerActions: [
        { label: 'Admin Only', visible: visible.asReadonly(), invoke: () => { /* no-op */ } },
        { label: 'Always', invoke: () => { /* no-op */ } },
      ],
    });
    let btns = fixture.nativeElement.querySelectorAll('[data-test="signal-detail-header-action"]');
    expect(btns.length).toBe(1);
    expect(btns[0].textContent).toContain('Always');
    visible.set(true);
    fixture.detectChanges();
    btns = fixture.nativeElement.querySelectorAll('[data-test="signal-detail-header-action"]');
    expect(btns.length).toBe(2);
  });

  it('disables action buttons when disabled signal returns true', () => {
    const disabled = signal(true);
    const fixture = setup({
      headerActions: [
        { label: 'Maybe', disabled: disabled.asReadonly(), invoke: () => { /* no-op */ } },
      ],
    });
    const btn = fixture.nativeElement.querySelector('[data-test="signal-detail-header-action"]');
    expect(btn.disabled).toBe(true);
    disabled.set(false);
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
  });

  it('clicking a header action invokes its handler', () => {
    const invoke = vi.fn();
    const fixture = setup({ headerActions: [{ label: 'Do It', invoke }] });
    fixture.nativeElement.querySelector('[data-test="signal-detail-header-action"]').click();
    expect(invoke).toHaveBeenCalledOnce();
  });

  it('does not invoke a disabled action even if clicked', () => {
    const invoke = vi.fn();
    const fixture = setup({
      headerActions: [{ label: 'Locked', disabled: signal(true).asReadonly(), invoke }],
    });
    fixture.nativeElement.querySelector('[data-test="signal-detail-header-action"]').click();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('renders the tab nav row with a tab per visible entry', () => {
    const fixture = setup({
      tabs: signal([
        { label: 'Summary', link: ['summary'] },
        { label: 'Bindings', link: ['bindings'], icon: 'link' },
      ]).asReadonly(),
    });
    const tabs = fixture.nativeElement.querySelectorAll('[data-test="signal-detail-tab"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('Summary');
    expect(tabs[1].textContent).toContain('Bindings');
    expect(tabs[1].querySelector('.material-icons')?.textContent).toBe('link');
  });

  it('hides tabs whose hidden signal returns true; reactive flip restores them', () => {
    const hidden = signal(true);
    const fixture = setup({
      tabs: signal([
        { label: 'Admin', link: ['admin'], hidden: hidden.asReadonly() },
        { label: 'Public', link: ['public'] },
      ]).asReadonly(),
    });
    let tabs = fixture.nativeElement.querySelectorAll('[data-test="signal-detail-tab"]');
    expect(tabs.length).toBe(1);
    expect(tabs[0].textContent).toContain('Public');
    hidden.set(false);
    fixture.detectChanges();
    tabs = fixture.nativeElement.querySelectorAll('[data-test="signal-detail-tab"]');
    expect(tabs.length).toBe(2);
  });

  it('skips the tab nav row when tabs signal returns empty', () => {
    const fixture = setup({ tabs: signal([]).asReadonly() });
    expect(fixture.nativeElement.querySelector('[data-test="signal-detail-tabs"]')).toBeNull();
  });

  it('shows loading state instead of body when loading signal is true', () => {
    const fixture = setup({ loading: signal(true).asReadonly() });
    expect(fixture.nativeElement.querySelector('[data-test="signal-detail-loading"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="body-content"]')).toBeNull();
  });

  it('shows error banner instead of body when error signal returns a non-null value', () => {
    const fixture = setup({ error: signal(new Error('oops')).asReadonly() });
    const err = fixture.nativeElement.querySelector('[data-test="signal-detail-error"]');
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('oops');
    expect(fixture.nativeElement.querySelector('[data-test="body-content"]')).toBeNull();
  });

  it('renders projected body content when not loading and no error', () => {
    const fixture = setup({});
    expect(fixture.nativeElement.querySelector('[data-test="body-content"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="signal-detail-loading"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="signal-detail-error"]')).toBeNull();
  });

  it('error message stringifies non-Error values', () => {
    const fixture = setup({ error: signal('plain string err').asReadonly() });
    expect(fixture.nativeElement.querySelector('[data-test="signal-detail-error"]').textContent).toContain('plain string err');
  });
});
