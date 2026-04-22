import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { SignalListComponent } from './signal-list.component';
import type { SignalListConfig, SignalListDropdown, SignalListDropdownOption } from './signal-list.component';

@Component({
  standalone: true,
  imports: [SignalListComponent],
  template: `<app-signal-list [config]="config" />`
})
class Host {
  items = signal([{ name: 'one' }, { name: 'two' }]);
  pageIndex = signal(0);
  pageSize = signal(10);
  config: SignalListConfig<{ name: string }> = {
    pagedItems: this.items.asReadonly(),
    totalFilteredResults: signal(2).asReadonly(),
    totalPages: signal(1).asReadonly(),
    pageIndex: this.pageIndex,
    pageSize: this.pageSize,
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
    columns: [{ header: 'Name', render: r => r.name }],
    getRowKey: r => r.name,
  };
}

describe('SignalListComponent', () => {
  it('renders a row per paged item', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-test="row"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('one');
    expect(rows[1].textContent).toContain('two');
  });

  it('renders a loading indicator when isAnyLoading is true', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.config = { ...fixture.componentInstance.config, isAnyLoading: signal(true).asReadonly() };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="loading"]')).not.toBeNull();
  });

  it('renders the empty state when totalFilteredResults is 0', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      totalFilteredResults: signal(0).asReadonly(),
    };
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('[data-test="empty"]');
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('There are no items');
  });

  it('resets pageIndex to 0 when page size changes', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.pageIndex.set(3);
    fixture.detectChanges();
    const component = fixture.debugElement.children[0].componentInstance as SignalListComponent<{ name: string }>;
    component.onPageSizeChange('20');
    expect(fixture.componentInstance.pageSize()).toBe(20);
    expect(fixture.componentInstance.pageIndex()).toBe(0);
  });

  it('renders a filter dropdown per config.filterDropdowns entry', () => {
    const fixture = TestBed.createComponent(Host);
    const selected = signal<string | null>(null);
    const options = signal<SignalListDropdownOption[]>([
      { label: 'All', value: null },
      { label: 'CF-1', value: 'cf-1' },
      { label: 'CF-2', value: 'cf-2' },
    ]);
    const dropdown: SignalListDropdown = {
      label: 'Cloud Foundry',
      options: options.asReadonly(),
      selected,
    };
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      filterDropdowns: [dropdown],
    };
    fixture.detectChanges();
    const ddEl = fixture.nativeElement.querySelector('[data-test="dropdown-Cloud Foundry"]');
    expect(ddEl).not.toBeNull();
    const opts = ddEl.querySelectorAll('option');
    expect(opts.length).toBe(3);
    expect(opts[0].textContent).toContain('All');
    expect(opts[1].textContent).toContain('CF-1');
  });

  it('onDropdownChange updates selected and resets pageIndex', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.pageIndex.set(4);
    fixture.detectChanges();
    const component = fixture.debugElement.children[0].componentInstance as SignalListComponent<{ name: string }>;
    const selected = signal<string | null>(null);
    const dropdown: SignalListDropdown = {
      label: 'CF',
      options: signal([]).asReadonly(),
      selected,
    };
    component.onDropdownChange(dropdown, 'cf-1');
    expect(selected()).toBe('cf-1');
    expect(fixture.componentInstance.pageIndex()).toBe(0);
    component.onDropdownChange(dropdown, '');
    expect(selected()).toBeNull();
  });
});
