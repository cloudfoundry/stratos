import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SignalListComponent } from './signal-list.component';
import type { SignalListConfig, SignalListDropdown, SignalListDropdownOption } from './signal-list.component';

// SignalListComponent now applies [routerLink] to the card / table row when a
// link column is present, so the RouterLink directive needs a router injector.
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
});

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
    // Inline refresh indicator lives on this button; onRefresh must be
    // present for the button (and therefore the refreshing-state spinner)
    // to render.
    onRefresh: () => {},
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

  it('swaps the refresh button into the refreshing-state indicator when items present and isAnyLoading is true', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.config = { ...fixture.componentInstance.config, isAnyLoading: signal(true).asReadonly() };
    fixture.detectChanges();
    // The same button toggles from data-test="refresh" → data-test="refresh-loading"
    // (and from refresh icon → spinner) when a reload is mid-flight against
    // a populated table — no separate row, no layout shift.
    expect(fixture.nativeElement.querySelector('[data-test="refresh"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="refresh-loading"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="refresh-loading"] .spinner')).not.toBeNull();
  });

  it('shows the refresh icon (not spinner) when not loading', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="refresh"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="refresh-loading"]')).toBeNull();
  });

  it('renders the full loading indicator when no items and isAnyLoading is true', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      totalFilteredResults: signal(0).asReadonly(),
      isAnyLoading: signal(true).asReadonly(),
    };
    fixture.detectChanges();
    // Empty + loading: show prominent centered spinner
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

  it('renders a Clear button when config.onClear is provided', () => {
    const fixture = TestBed.createComponent(Host);
    const nameFilter = signal('');
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      nameFilter,
      onClear: () => { /* no-op */ },
    };
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('[data-test="clear-filters"]');
    expect(btn).not.toBeNull();
    // Disabled when no filter is active.
    expect(btn.disabled).toBe(true);
    // Setting nameFilter to a non-empty string activates the button.
    nameFilter.set('foo');
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
  });

  it('clicking the Clear button invokes config.onClear', () => {
    const fixture = TestBed.createComponent(Host);
    const onClear = vi.fn();
    const nameFilter = signal('foo');
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      nameFilter,
      onClear,
    };
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('[data-test="clear-filters"]');
    btn.click();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('Clear button is enabled when a dropdown has a non-null selection', () => {
    const fixture = TestBed.createComponent(Host);
    const selected = signal<string | null>('cf-1');
    const dropdown: SignalListDropdown = {
      label: 'CF',
      options: signal([]).asReadonly(),
      selected,
    };
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      filterDropdowns: [dropdown],
      onClear: () => { /* no-op */ },
    };
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('[data-test="clear-filters"]');
    expect(btn.disabled).toBe(false);
    selected.set(null);
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
  });

  // Note: SignalListConfig.headerActions was removed (see commit
  // "Sweep remaining headerActions consumers; remove the field"). The
  // 7 tests that asserted on header-action rendering, visibility,
  // disabled state, click handling, and accent styling were dropped
  // along with the field. The replacement page-level "+ Add" pattern
  // is now driven by ListSubNavComponent and tested per-consumer.

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

  // Compound-cell maxVisible / collapse-expand. The motivating scenario:
  // an admin user with thousands of space role grants overflowed the row
  // and pushed the username out of the viewport (see
  // project_signallist_row_overflow.md). The cap renders a fixed number
  // of segments + a "…and N more" affordance that toggles to show all.
  it('caps compound-cell segments to maxVisible and expands on click', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config" />`
    })
    class CompoundHost {
      private segments = Array.from({ length: 10 }, (_, i) => ({ text: `seg-${i}` }));
      items = signal([{ name: 'admin' }]);
      pageIndex = signal(0);
      pageSize = signal(10);
      config: SignalListConfig<{ name: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(1).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        columns: [
          { header: 'Name', render: r => r.name },
          {
            header: 'Roles',
            kind: 'compound',
            render: () => 'roles-text',
            compound: () => this.segments,
            maxVisible: 3,
            collapsedLabel: (n: number) => `…and ${n} more roles`,
          },
        ],
        getRowKey: r => r.name,
      };
    }

    const fixture = TestBed.createComponent(CompoundHost);
    fixture.detectChanges();

    // Compound cell — only the first 3 segments visible.
    const cell = fixture.nativeElement.querySelectorAll('td')[1] as HTMLElement;
    expect(cell.textContent).toContain('seg-0');
    expect(cell.textContent).toContain('seg-2');
    expect(cell.textContent).not.toContain('seg-3');
    expect(cell.textContent).not.toContain('seg-9');

    // Affordance present and uses the custom collapsedLabel.
    const expandBtn = cell.querySelector('[data-test="compound-expand"]') as HTMLButtonElement;
    expect(expandBtn).not.toBeNull();
    expect(expandBtn.textContent).toContain('…and 7 more roles');

    // Click expands.
    expandBtn.click();
    fixture.detectChanges();
    expect(cell.textContent).toContain('seg-9');
    const collapseBtn = cell.querySelector('[data-test="compound-collapse"]') as HTMLButtonElement;
    expect(collapseBtn).not.toBeNull();
    expect(collapseBtn.textContent).toContain('…show fewer');
    expect(cell.querySelector('[data-test="compound-expand"]')).toBeNull();

    // Click again collapses back to 3.
    collapseBtn.click();
    fixture.detectChanges();
    expect(cell.textContent).not.toContain('seg-9');
    expect(cell.querySelector('[data-test="compound-expand"]')).not.toBeNull();
    expect(cell.querySelector('[data-test="compound-collapse"]')).toBeNull();
  });

  it('renders all segments when count is at or below maxVisible (no affordance)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config" />`
    })
    class SmallHost {
      items = signal([{ name: 'a' }]);
      pageIndex = signal(0);
      pageSize = signal(10);
      config: SignalListConfig<{ name: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(1).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        columns: [
          { header: 'Name', render: r => r.name },
          {
            header: 'Roles',
            kind: 'compound',
            render: () => 'roles',
            compound: () => [{ text: 'one' }, { text: 'two' }],
            maxVisible: 5,
          },
        ],
        getRowKey: r => r.name,
      };
    }
    const fixture = TestBed.createComponent(SmallHost);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelectorAll('td')[1] as HTMLElement;
    expect(cell.textContent).toContain('one');
    expect(cell.textContent).toContain('two');
    expect(cell.querySelector('[data-test="compound-expand"]')).toBeNull();
    expect(cell.querySelector('[data-test="compound-collapse"]')).toBeNull();
  });

  it('renders all segments when maxVisible is unset (zero behavior change for existing pages)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config" />`
    })
    class UncappedHost {
      items = signal([{ name: 'a' }]);
      pageIndex = signal(0);
      pageSize = signal(10);
      config: SignalListConfig<{ name: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(1).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        columns: [
          { header: 'Name', render: r => r.name },
          {
            header: 'Roles',
            kind: 'compound',
            render: () => 'roles',
            compound: () => Array.from({ length: 50 }, (_, i) => ({ text: `s${i}` })),
          },
        ],
        getRowKey: r => r.name,
      };
    }
    const fixture = TestBed.createComponent(UncappedHost);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelectorAll('td')[1] as HTMLElement;
    expect(cell.textContent).toContain('s0');
    expect(cell.textContent).toContain('s49');
    expect(cell.querySelector('[data-test="compound-expand"]')).toBeNull();
  });

  it('compound expansion is independent across two compound columns on the same row', () => {
    // Two compound columns on the same row both overflow. Expanding one
    // must not expand the other — keying is by (rowKey, columnKey).
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config" />`
    })
    class TwoCompoundHost {
      items = signal([{ name: 'admin' }]);
      pageIndex = signal(0);
      pageSize = signal(10);
      config: SignalListConfig<{ name: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(1).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        columns: [
          { header: 'Name', render: r => r.name },
          {
            header: 'Orgs', key: 'orgs',
            kind: 'compound',
            render: () => 'orgs',
            compound: () => Array.from({ length: 6 }, (_, i) => ({ text: `org-${i}` })),
            maxVisible: 2,
          },
          {
            header: 'Spaces', key: 'spaces',
            kind: 'compound',
            render: () => 'spaces',
            compound: () => Array.from({ length: 6 }, (_, i) => ({ text: `sp-${i}` })),
            maxVisible: 2,
          },
        ],
        getRowKey: r => r.name,
      };
    }
    const fixture = TestBed.createComponent(TwoCompoundHost);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('td');
    const orgsCell = cells[1] as HTMLElement;
    const spacesCell = cells[2] as HTMLElement;

    // Initially both collapsed.
    expect(orgsCell.textContent).not.toContain('org-5');
    expect(spacesCell.textContent).not.toContain('sp-5');

    // Click expand on Orgs only.
    (orgsCell.querySelector('[data-test="compound-expand"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(orgsCell.textContent).toContain('org-5');
    // Spaces should still be collapsed.
    expect(spacesCell.textContent).not.toContain('sp-5');
    expect(spacesCell.querySelector('[data-test="compound-expand"]')).not.toBeNull();
  });

  describe('radio-select column (kind: radio)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config" />`
    })
    class RadioHost {
      items = signal([
        { name: 'one' },
        { name: 'two' },
        { name: 'three-disabled' },
      ]);
      selected = signal<string | null>(null);
      pageIndex = signal(0);
      pageSize = signal(10);
      config: SignalListConfig<{ name: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(3).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        columns: [
          {
            header: 'Pick', key: 'pick',
            kind: 'radio',
            render: () => '',
            radio: {
              selectedKey: this.selected,
              isDisabled: (r) => r.name === 'three-disabled',
            },
          },
          { header: 'Name', render: r => r.name },
        ],
        getRowKey: r => r.name,
      };
    }

    it('renders one radio input per row', () => {
      const fixture = TestBed.createComponent(RadioHost);
      fixture.detectChanges();
      const radios = fixture.nativeElement.querySelectorAll('[data-test="row-radio"]');
      expect(radios.length).toBe(3);
    });

    it('clicking a radio writes the row key to the selection signal', () => {
      const fixture = TestBed.createComponent(RadioHost);
      fixture.detectChanges();
      const radios = fixture.nativeElement.querySelectorAll('[data-test="row-radio"]') as NodeListOf<HTMLInputElement>;
      radios[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('two');
    });

    it('selected row reads checked from the signal', () => {
      const fixture = TestBed.createComponent(RadioHost);
      fixture.componentInstance.selected.set('one');
      fixture.detectChanges();
      const radios = fixture.nativeElement.querySelectorAll('[data-test="row-radio"]') as NodeListOf<HTMLInputElement>;
      expect(radios[0].checked).toBe(true);
      expect(radios[1].checked).toBe(false);
    });

    it('disabled rows render disabled radio and clicks are no-ops', () => {
      const fixture = TestBed.createComponent(RadioHost);
      fixture.detectChanges();
      const radios = fixture.nativeElement.querySelectorAll('[data-test="row-radio"]') as NodeListOf<HTMLInputElement>;
      expect(radios[2].disabled).toBe(true);
      radios[2].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe(null);
    });

    it('selecting a different row replaces the previous selection (single-select)', () => {
      const fixture = TestBed.createComponent(RadioHost);
      fixture.detectChanges();
      const radios = fixture.nativeElement.querySelectorAll('[data-test="row-radio"]') as NodeListOf<HTMLInputElement>;
      radios[0].click();
      fixture.detectChanges();
      radios[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('two');
      expect(radios[0].checked).toBe(false);
      expect(radios[1].checked).toBe(true);
    });
  });
});
