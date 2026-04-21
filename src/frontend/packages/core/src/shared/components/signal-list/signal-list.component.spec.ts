import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { SignalListComponent } from './signal-list.component';
import type { SignalListConfig } from './signal-list.component';

@Component({
  standalone: true,
  imports: [SignalListComponent],
  template: `<app-signal-list [config]="config" />`
})
class Host {
  items = signal([{ name: 'one' }, { name: 'two' }]);
  config: SignalListConfig<{ name: string }> = {
    pagedItems: this.items.asReadonly(),
    totalFilteredResults: signal(2).asReadonly(),
    totalPages: signal(1).asReadonly(),
    pageIndex: signal(0),
    pageSize: signal(10),
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
});
