import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SignalListComponent } from './signal-list.component';
import type { SignalListConfig, SignalListDropdown, SignalListDropdownOption, SignalListMultiFilter, SignalListRowState } from './signal-list.component';
import type { SignalListRangeValue } from './range-filter';
import { SignalListCellTemplateDirective } from './signal-list-cell-template.directive';

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

  it('row-action menu items expose data-test hooks (label default, dataTest override)', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      columns: [
        { header: 'Name', render: r => r.name },
        {
          header: '', kind: 'actions', render: () => '',
          actions: () => [
            { label: 'Delete', invoke: () => {} },
            { label: 'Rename', dataTest: 'rename-row', invoke: () => {} },
          ],
        },
      ],
    };
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-test="row-actions"]').click();
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('[data-test="row-actions-menu"]');
    expect(menu.querySelector('[data-test="row-action-Delete"]')).not.toBeNull();
    expect(menu.querySelector('[data-test="rename-row"]')).not.toBeNull();
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

  it('drives the spinner from invokeRefresh even when isAnyLoading stays false', async () => {
    // Many config services wire isAnyLoading to !hasLoadedOnce() which is
    // permanently false after the first load. The internal isRefreshing
    // signal — flipped by invokeRefresh — is what keeps the spinner alive
    // across subsequent refresh clicks.
    let resolveRefresh!: () => void;
    const refreshPromise = new Promise<void>(r => { resolveRefresh = r; });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      onRefresh: () => refreshPromise,
    };
    fixture.detectChanges();
    const component = fixture.debugElement.children[0].componentInstance as SignalListComponent<{ name: string }>;

    expect(fixture.nativeElement.querySelector('[data-test="refresh"]')).not.toBeNull();
    const result = component.invokeRefresh();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="refresh-loading"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="refresh-loading"] .spinner')).not.toBeNull();

    resolveRefresh();
    await result;
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

  it('renders the failed-load state with a working Retry button when empty and errored (#5577)', async () => {
    const onRefresh = vi.fn();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      totalFilteredResults: signal(0).asReadonly(),
      errorsByCnsi: signal(new Map<string, unknown>([['cnsi-1', new Error('boom')]])).asReadonly(),
      errorMessage: 'Failed to load organizations',
      onRefresh,
    };
    fixture.detectChanges();
    // Failed-load state replaces the plain empty state...
    expect(fixture.nativeElement.querySelector('[data-test="empty"]')).toBeNull();
    const errorState = fixture.nativeElement.querySelector('[data-test="empty-error"]');
    expect(errorState).not.toBeNull();
    expect(errorState.textContent).toContain('Failed to load organizations');
    // ...and its Retry button drives the same refresh handler as the toolbar.
    const retry = fixture.nativeElement.querySelector('[data-test="empty-error-retry"]');
    expect(retry).not.toBeNull();
    retry.click();
    await fixture.whenStable();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('prefers the plain empty state when empty without errors', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      totalFilteredResults: signal(0).asReadonly(),
    };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="empty-error"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="empty"]')).not.toBeNull();
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

  describe('"All" page size (-1)', () => {
    function componentWith(fixture: ReturnType<typeof TestBed.createComponent<Host>>) {
      return fixture.debugElement.children[0].componentInstance as SignalListComponent<{ name: string }>;
    }

    it('appends All (-1) to card-mode options and labels it', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.config = {
        ...fixture.componentInstance.config,
        viewMode: signal<'table' | 'card'>('card'),
        pageSizeOptions: { table: [10, 25], card: [6, 12] },
      };
      fixture.detectChanges();
      const component = componentWith(fixture);
      expect(component.pageSizeOptions()).toEqual([6, 12, -1]);
      expect(component.pageSizeLabel(-1)).toBe('All');
      expect(component.pageSizeLabel(12)).toBe('12');
    });

    it('does not add All to table-mode options', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.config = {
        ...fixture.componentInstance.config,
        viewMode: signal<'table' | 'card'>('table'),
        pageSizeOptions: { table: [10, 25], card: [6, 12] },
      };
      fixture.detectChanges();
      expect(componentWith(fixture).pageSizeOptions()).toEqual([10, 25]);
    });

    it('accepts -1 from the select and reports the full range', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.pageIndex.set(2);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.onPageSizeChange('-1');
      expect(fixture.componentInstance.pageSize()).toBe(-1);
      expect(fixture.componentInstance.pageIndex()).toBe(0);
      expect(component.rangeText()).toBe('1 – 2 of 2');
    });

    it('still rejects zero and garbage page sizes', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.onPageSizeChange('0');
      component.onPageSizeChange('bogus');
      expect(fixture.componentInstance.pageSize()).toBe(10);
    });

    // #5670: pageIndex persists across navigation, so it can point past the
    // end of the current data set. The pager must describe (and navigate
    // from) the clamped page — the raw index produced "85 – 1 of 1" over a
    // one-row list.
    describe('stale out-of-range pageIndex', () => {
      function staleFixture() {
        const fixture = TestBed.createComponent(Host);
        fixture.componentInstance.pageIndex.set(14);
        fixture.componentInstance.pageSize.set(6);
        fixture.componentInstance.config = {
          ...fixture.componentInstance.config,
          totalFilteredResults: signal(1).asReadonly(),
          totalPages: signal(1).asReadonly(),
        };
        fixture.detectChanges();
        return fixture;
      }

      it('range label describes the clamped page, not the stale index', () => {
        const fixture = staleFixture();
        expect(componentWith(fixture).rangeText()).toBe('1 – 1 of 1');
      });

      it('clamps effectivePageIndex and disables prev/next on the only page', () => {
        const fixture = staleFixture();
        expect(componentWith(fixture).effectivePageIndex()).toBe(0);
        expect(fixture.nativeElement.querySelector('[title="Previous page"]').disabled).toBe(true);
        expect(fixture.nativeElement.querySelector('[title="Next page"]').disabled).toBe(true);
      });
    });

    // #5670: changing the text filter redefines the result set, so the
    // pager returns to page 1 — matching the dropdown/sort/filter-field
    // behaviour. Staying mid-list showed a filtered set's last page and
    // hid matches that sort earlier.
    it('typing in the name filter resets pageIndex to 0', () => {
      const fixture = TestBed.createComponent(Host);
      const nameFilter = signal('');
      fixture.componentInstance.config = { ...fixture.componentInstance.config, nameFilter };
      fixture.componentInstance.pageIndex.set(3);
      fixture.detectChanges();
      componentWith(fixture).onNameFilterChange('cf');
      expect(nameFilter()).toBe('cf');
      expect(fixture.componentInstance.pageIndex()).toBe(0);
    });

    // Filtering is a detour, not a destination: entering the filter saves
    // the unfiltered position and erasing it restores it, so a user who
    // filters from page 2 lands back on page 2 — even after paging within
    // the filtered results.
    it('erasing the filter restores the pre-filter page', () => {
      const fixture = TestBed.createComponent(Host);
      const nameFilter = signal('');
      fixture.componentInstance.config = { ...fixture.componentInstance.config, nameFilter };
      fixture.componentInstance.pageIndex.set(2);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.onNameFilterChange('cf');
      expect(fixture.componentInstance.pageIndex()).toBe(0);
      fixture.componentInstance.pageIndex.set(1); // page within filtered results
      component.onNameFilterChange('');
      expect(fixture.componentInstance.pageIndex()).toBe(2);
    });

    it('erasing a filter that was never entered stays on page 0', () => {
      const fixture = TestBed.createComponent(Host);
      const nameFilter = signal('');
      fixture.componentInstance.config = { ...fixture.componentInstance.config, nameFilter };
      fixture.detectChanges();
      componentWith(fixture).onNameFilterChange('');
      expect(fixture.componentInstance.pageIndex()).toBe(0);
    });

    it('does not snap All away when switching to card view', () => {
      // Regression: setViewMode must validate against the effective card
      // options (which include -1), not the raw config list — otherwise a
      // per-view remembered "All" is destroyed on return to card view.
      const fixture = TestBed.createComponent(Host);
      const viewMode = signal<'table' | 'card'>('table');
      fixture.componentInstance.pageSize.set(-1);
      fixture.componentInstance.config = {
        ...fixture.componentInstance.config,
        viewMode,
        pageSizeOptions: { table: [10, 25], card: [6, 12] },
      };
      fixture.detectChanges();
      componentWith(fixture).setViewMode('card');
      expect(fixture.componentInstance.pageSize()).toBe(-1);
    });

    it('snaps All back to a concrete size when switching to table view', () => {
      const fixture = TestBed.createComponent(Host);
      const viewMode = signal<'table' | 'card'>('card');
      fixture.componentInstance.pageSize.set(-1);
      fixture.componentInstance.config = {
        ...fixture.componentInstance.config,
        viewMode,
        pageSizeOptions: { table: [10, 25], card: [6, 12] },
      };
      fixture.detectChanges();
      componentWith(fixture).setViewMode('table');
      expect(fixture.componentInstance.pageSize()).toBe(10);
    });
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

  it('Clear button is enabled when a filterMultis selection is non-null (narrowed or explicitly empty)', () => {
    const fixture = TestBed.createComponent(Host);
    const selected = signal<string[] | null>(null);
    const fm: SignalListMultiFilter = {
      field: 'name',
      options: signal(['a', 'b']).asReadonly(),
      selected,
    };
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      filterMultis: [fm],
      onClear: () => { /* no-op */ },
    };
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('[data-test="clear-filters"]');
    expect(btn.disabled).toBe(true);
    selected.set(['a']);
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
    selected.set([]);
    fixture.detectChanges();
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

  describe('checkbox-select column (kind: checkbox)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config" />`
    })
    class CheckboxHost {
      items = signal([
        { name: 'one' },
        { name: 'two' },
        { name: 'three-disabled' },
      ]);
      selected = signal<ReadonlySet<string>>(new Set<string>());
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
            kind: 'checkbox',
            render: () => '',
            checkbox: {
              selectedKeys: this.selected,
              isDisabled: (r) => r.name === 'three-disabled',
            },
          },
          { header: 'Name', render: r => r.name },
        ],
        getRowKey: r => r.name,
      };
    }

    it('renders one checkbox per row', () => {
      const fixture = TestBed.createComponent(CheckboxHost);
      fixture.detectChanges();
      const boxes = fixture.nativeElement.querySelectorAll('[data-test="row-checkbox"]');
      expect(boxes.length).toBe(3);
    });

    it('clicking a checkbox adds the row key to the selection set', () => {
      const fixture = TestBed.createComponent(CheckboxHost);
      fixture.detectChanges();
      const boxes = fixture.nativeElement.querySelectorAll('[data-test="row-checkbox"]') as NodeListOf<HTMLInputElement>;
      boxes[0].click();
      fixture.detectChanges();
      boxes[1].click();
      fixture.detectChanges();
      const selected = fixture.componentInstance.selected();
      expect(selected.has('one')).toBe(true);
      expect(selected.has('two')).toBe(true);
      expect(selected.size).toBe(2);
    });

    it('clicking a selected checkbox removes the row key', () => {
      const fixture = TestBed.createComponent(CheckboxHost);
      fixture.componentInstance.selected.set(new Set(['one']));
      fixture.detectChanges();
      const boxes = fixture.nativeElement.querySelectorAll('[data-test="row-checkbox"]') as NodeListOf<HTMLInputElement>;
      expect(boxes[0].checked).toBe(true);
      boxes[0].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected().size).toBe(0);
    });

    it('disabled rows render disabled checkbox and clicks are no-ops', () => {
      const fixture = TestBed.createComponent(CheckboxHost);
      fixture.detectChanges();
      const boxes = fixture.nativeElement.querySelectorAll('[data-test="row-checkbox"]') as NodeListOf<HTMLInputElement>;
      expect(boxes[2].disabled).toBe(true);
      boxes[2].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected().has('three-disabled')).toBe(false);
    });
  });

  describe('template column (kind: template)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent, SignalListCellTemplateDirective],
      template: `
        <app-signal-list [config]="config">
          <ng-template appSignalListCell="custom" let-row>
            <span data-test="custom-cell">CUSTOM:{{ row.name }}</span>
          </ng-template>
        </app-signal-list>
      `,
    })
    class TemplateHost {
      items = signal([
        { name: 'one' },
        { name: 'two' },
      ]);
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
        columns: [
          { header: 'Name', render: r => r.name },
          {
            header: 'Custom', key: 'custom',
            kind: 'template',
            templateName: 'custom',
            render: () => '',
          },
        ],
        getRowKey: r => r.name,
      };
    }

    it('renders the named template once per row with the row context', () => {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.detectChanges();
      const cells = fixture.nativeElement.querySelectorAll('[data-test="custom-cell"]');
      expect(cells.length).toBe(2);
      expect(cells[0].textContent).toContain('CUSTOM:one');
      expect(cells[1].textContent).toContain('CUSTOM:two');
    });

    it('falls through cleanly when templateName has no matching ng-template', () => {
      const fixture = TestBed.createComponent(TemplateHost);
      // Mutate config so templateName references a missing template.
      fixture.componentInstance.config = {
        ...fixture.componentInstance.config,
        columns: [
          { header: 'Name', render: r => r.name },
          { header: 'Custom', key: 'custom', kind: 'template', templateName: 'missing', render: () => '' },
        ],
      };
      fixture.detectChanges();
      // Should not throw; missing-template cells just render empty.
      expect(fixture.nativeElement.querySelectorAll('[data-test="custom-cell"]').length).toBe(0);
    });
  });

  // Guard: card view must expose bulk selection in the header cluster, and a
  // leading checkbox column must NOT steal the title slot. Routes list its
  // checkbox column first, which previously blanked the card title (title =
  // columns[0]) and hid the checkbox entirely. These fail if the checkbox
  // stops rendering in the header, or if the title reverts to columns[0].
  describe('card-view bulk select (default renderer, leading checkbox column)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config"></app-signal-list>`,
    })
    class CardBulkHost {
      items = signal([{ name: 'one', guid: 'g-one' }, { name: 'two', guid: 'g-two' }]);
      selected = signal<ReadonlySet<string>>(new Set<string>());
      config: SignalListConfig<{ name: string; guid: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(2).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: signal(0),
        pageSize: signal(10),
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        viewMode: signal<'table' | 'card'>('card'),
        columns: [
          // Checkbox FIRST — the routes ordering that used to break the title.
          {
            header: 'Pick', key: 'pick', kind: 'checkbox', render: () => '',
            checkbox: { selectedKeys: this.selected },
          },
          { header: 'Name', key: 'name', render: r => r.name, tooltip: r => r.guid },
        ],
        bulkActions: [{ label: 'Delete', run: () => undefined }],
        getRowKey: r => r.name,
      };
    }

    it('renders the checkbox in the header cluster; selecting drives the bulk bar', () => {
      const fixture = TestBed.createComponent(CardBulkHost);
      fixture.detectChanges();
      const boxes = fixture.nativeElement
        .querySelectorAll('[data-test="card-select-checkbox"]') as NodeListOf<HTMLInputElement>;
      expect(boxes.length).toBe(2);
      expect(fixture.nativeElement.querySelector('[data-test="bulk-action-bar"]')).toBeNull();
      boxes[0].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected().has('one')).toBe(true);
      expect(fixture.nativeElement.querySelector('[data-test="bulk-action-bar"]')).not.toBeNull();
    });

    it('uses the first non-control column as the title (checkbox does not blank it)', () => {
      const fixture = TestBed.createComponent(CardBulkHost);
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-test="card"]');
      // Title text is the Name column, not the empty checkbox column.
      expect((cards[0] as HTMLElement).textContent).toContain('one');
      // Title tooltip comes from the column's tooltip fn (full guid on hover).
      const title = cards[0].querySelector('span[title]') as HTMLElement;
      expect(title.getAttribute('title')).toBe('g-one');
    });

    it('does not also render the title column as a body detail row', () => {
      const fixture = TestBed.createComponent(CardBulkHost);
      fixture.detectChanges();
      const card = fixture.nativeElement.querySelector('[data-test="card"]') as HTMLElement;
      // The title column is the header; it must not repeat as a label:value
      // detail row. A doubled title means the suppression missed it.
      const nameOccurrences = (card.textContent!.match(/one/g) ?? []).length;
      expect(nameOccurrences).toBe(1);
    });
  });

  // Guard: while a bulk op is in flight (bulkRunning() === true) the bar shows
  // the "Working…" spinner and disables its action buttons so the user can't
  // double-fire; it clears once the op settles.
  describe('bulk-action bar in-flight spinner (bulkRunning)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config"></app-signal-list>`,
    })
    class BulkRunningHost {
      items = signal([{ name: 'one' }]);
      selected = signal<ReadonlySet<string>>(new Set(['one']));
      running = signal(true);
      config: SignalListConfig<{ name: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(1).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: signal(0),
        pageSize: signal(10),
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        viewMode: signal<'table' | 'card'>('table'),
        columns: [
          { header: 'Pick', key: 'pick', kind: 'checkbox', render: () => '', checkbox: { selectedKeys: this.selected } },
          { header: 'Name', key: 'name', render: r => r.name },
        ],
        bulkActions: [{ label: 'Delete', run: () => undefined }],
        bulkRunning: this.running,
        getRowKey: r => r.name,
      };
    }

    it('shows the spinner and disables actions while running, clears when done', () => {
      const fixture = TestBed.createComponent(BulkRunningHost);
      fixture.detectChanges();
      const del = () => fixture.nativeElement.querySelector('[data-test="bulk-action-Delete"]') as HTMLButtonElement;
      expect(fixture.nativeElement.querySelector('[data-test="bulk-running"]')).not.toBeNull();
      expect(del().disabled).toBe(true);

      fixture.componentInstance.running.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-test="bulk-running"]')).toBeNull();
      expect(del().disabled).toBe(false);
    });
  });

  describe('external-link column (externalLink)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config" />`,
    })
    class ExtHost {
      items = signal([
        { name: 'with', url: 'https://dash.example/x' },
        { name: 'without', url: '' },
      ]);
      pageIndex = signal(0);
      pageSize = signal(10);
      config: SignalListConfig<{ name: string; url: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(2).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        columns: [
          { header: 'Name', render: r => r.name },
          {
            header: 'Dashboard', key: 'dashboard', kind: 'link',
            render: r => (r.url ? 'View' : 'None'),
            externalLink: r => r.url || null,
          },
        ],
        getRowKey: r => r.name,
      };
    }

    it('renders a new-tab external anchor for rows with a url, plain text otherwise', () => {
      const fixture = TestBed.createComponent(ExtHost);
      fixture.detectChanges();
      const anchor = fixture.nativeElement.querySelector('a[href="https://dash.example/x"]') as HTMLAnchorElement | null;
      expect(anchor).not.toBeNull();
      expect(anchor!.getAttribute('target')).toBe('_blank');
      expect(anchor!.getAttribute('rel')).toContain('noopener');
      expect(anchor!.textContent).toContain('View');
      // Exactly one external anchor (the url-less row renders plain "None").
      expect(fixture.nativeElement.querySelectorAll('a[target="_blank"]').length).toBe(1);
      expect(fixture.nativeElement.textContent).toContain('None');
    });

    it('renders the external anchor in card view too', () => {
      const fixture = TestBed.createComponent(ExtHost);
      fixture.componentInstance.config = {
        ...fixture.componentInstance.config,
        viewMode: signal<'table' | 'card'>('card'),
      };
      fixture.detectChanges();
      const anchor = fixture.nativeElement.querySelector('a[href="https://dash.example/x"]') as HTMLAnchorElement | null;
      expect(anchor).not.toBeNull();
      expect(anchor!.getAttribute('target')).toBe('_blank');
      expect(anchor!.textContent).toContain('View');
    });
  });

  describe('bulk-action bar (bulkActions slot)', () => {
    @Component({
      standalone: true,
      imports: [SignalListComponent],
      template: `<app-signal-list [config]="config" />`
    })
    class BulkHost {
      items = signal([{ name: 'one' }, { name: 'two' }, { name: 'three' }]);
      selected = signal<ReadonlySet<string>>(new Set<string>());
      pageIndex = signal(0);
      pageSize = signal(10);
      runSpy = vi.fn();
      config: SignalListConfig<{ name: string }> = {
        pagedItems: this.items.asReadonly(),
        totalFilteredResults: signal(3).asReadonly(),
        totalPages: signal(1).asReadonly(),
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        isAnyLoading: signal(false).asReadonly(),
        errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
        columns: [
          { header: 'Pick', key: 'pick', kind: 'checkbox', render: () => '',
            checkbox: { selectedKeys: this.selected } },
          { header: 'Name', render: r => r.name },
        ],
        getRowKey: r => r.name,
        bulkActions: [
          { label: 'Delete', icon: 'delete', danger: true, run: this.runSpy },
        ],
      };
    }

    it('does not render the bar when selection is empty', () => {
      const fixture = TestBed.createComponent(BulkHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-test="bulk-action-bar"]')).toBeNull();
    });

    it('renders the bar with count and action when 1+ rows are selected', () => {
      const fixture = TestBed.createComponent(BulkHost);
      fixture.componentInstance.selected.set(new Set(['one', 'two']));
      fixture.detectChanges();
      const bar = fixture.nativeElement.querySelector('[data-test="bulk-action-bar"]');
      expect(bar).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[data-test="bulk-selected-count"]').textContent).toContain('2 selected');
      expect(fixture.nativeElement.querySelector('[data-test="bulk-action-Delete"]')).not.toBeNull();
    });

    it('clicking a bulk action invokes run with the selection snapshot', async () => {
      const fixture = TestBed.createComponent(BulkHost);
      fixture.componentInstance.selected.set(new Set(['one', 'three']));
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('[data-test="bulk-action-Delete"]') as HTMLButtonElement;
      btn.click();
      await fixture.whenStable();
      expect(fixture.componentInstance.runSpy).toHaveBeenCalledTimes(1);
      const passed = fixture.componentInstance.runSpy.mock.calls[0][0] as ReadonlySet<string>;
      expect(passed.has('one')).toBe(true);
      expect(passed.has('three')).toBe(true);
      expect(passed.size).toBe(2);
    });

    it('Clear button empties the selection', () => {
      const fixture = TestBed.createComponent(BulkHost);
      fixture.componentInstance.selected.set(new Set(['one', 'two']));
      fixture.detectChanges();
      const clear = fixture.nativeElement.querySelector('[data-test="bulk-clear"]') as HTMLButtonElement;
      clear.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected().size).toBe(0);
      expect(fixture.nativeElement.querySelector('[data-test="bulk-action-bar"]')).toBeNull();
    });

    it('bar stays hidden when bulkActions is undefined even with selection', () => {
      const fixture = TestBed.createComponent(BulkHost);
      fixture.componentInstance.config = { ...fixture.componentInstance.config, bulkActions: undefined };
      fixture.componentInstance.selected.set(new Set(['one']));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-test="bulk-action-bar"]')).toBeNull();
    });

    it('bar stays hidden when bulkActions is empty array', () => {
      const fixture = TestBed.createComponent(BulkHost);
      fixture.componentInstance.config = { ...fixture.componentInstance.config, bulkActions: [] };
      fixture.componentInstance.selected.set(new Set(['one']));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-test="bulk-action-bar"]')).toBeNull();
    });

    it('disabled action does not invoke run', async () => {
      const fixture = TestBed.createComponent(BulkHost);
      const spy = vi.fn();
      fixture.componentInstance.config = {
        ...fixture.componentInstance.config,
        bulkActions: [{ label: 'Delete', run: spy, disabled: signal(true).asReadonly() }],
      };
      fixture.componentInstance.selected.set(new Set(['one']));
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('[data-test="bulk-action-Delete"]') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      btn.click();
      await fixture.whenStable();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});

@Component({
  standalone: true,
  imports: [SignalListComponent],
  template: `<app-signal-list [config]="config" />`
})
class RowStateHost {
  items = signal([{ name: 'one' }, { name: 'two' }]);
  states: Record<string, ReturnType<typeof signal<SignalListRowState>>> = {
    one: signal<SignalListRowState>({ warning: true, message: 'name taken' }),
    two: signal<SignalListRowState>({}),
  };
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
    rowState: r => this.states[r.name] ?? null,
  };
}

describe('SignalListComponent rowState', () => {
  it('renders a message sub-row only for rows with a message', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.detectChanges();
    const msgs = fixture.nativeElement.querySelectorAll('[data-test="row-message"]');
    expect(msgs.length).toBe(1);
    expect(msgs[0].textContent).toContain('name taken');
  });

  it('tints the message strip (not the data row) and uses the warning icon for warning state', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-test="row"]');
    expect(rows[0].className).not.toContain('border-warning-300');
    const msg = fixture.nativeElement.querySelector('[data-test="row-message"]');
    expect(msg.className).toContain('border-warning-300');
    const icon = msg.querySelector('.material-icons');
    expect(icon.textContent).toContain('warning');
  });

  it('uses the info icon for info state and red tint on the error message strip', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.componentInstance.states['one'].set({ info: true, message: 'just connecting' });
    fixture.componentInstance.states['two'].set({ error: true, message: 'bad' });
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-test="row"]');
    expect(rows[1].className).not.toContain('border-danger-300');
    const msgs = fixture.nativeElement.querySelectorAll('[data-test="row-message"]');
    expect(msgs[1].className).toContain('border-danger-300');
    const icons = fixture.nativeElement.querySelectorAll('[data-test="row-message"] .material-icons');
    expect(icons[0].textContent).toContain('info');
    expect(icons[1].textContent).toContain('warning'); // error → warning glyph
  });

  it('re-renders a row when its state signal changes (no pagedItems identity change)', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-test="row-message"]').length).toBe(1);
    fixture.componentInstance.states['two'].set({ error: true, message: 'now invalid' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-test="row-message"]').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('now invalid');
  });

  it('renders structured segments: bold, line break, and link', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.componentInstance.states['one'].set({
      error: true,
      message: [
        { text: 'Conflict', bold: true },
        { text: 'see docs', break: true, link: ['/help'] },
      ],
    });
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('[data-test="row-message"]');
    expect(msg.querySelector('.font-semibold')?.textContent).toContain('Conflict');
    expect(msg.querySelector('br')).not.toBeNull();
    const link = msg.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('see docs');
  });

  it('renders no message rows and no tint when rowState returns null', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.componentInstance.config = { ...fixture.componentInstance.config, rowState: () => null };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-test="row-message"]').length).toBe(0);
    const rows = fixture.nativeElement.querySelectorAll('[data-test="row"]');
    expect(rows[0].className).not.toContain('border-warning-300');
  });
});

@Component({
  standalone: true,
  imports: [SignalListComponent, SignalListCellTemplateDirective],
  template: `
    <app-signal-list [config]="config">
      <ng-template appSignalListCell="__rowMessage" let-row>
        <span data-test="custom-msg">custom for {{ row.name }}</span>
      </ng-template>
    </app-signal-list>`
})
class RowMessageTemplateHost {
  items = signal([{ name: 'one' }]);
  config: SignalListConfig<{ name: string }> = {
    pagedItems: this.items.asReadonly(),
    totalFilteredResults: signal(1).asReadonly(),
    totalPages: signal(1).asReadonly(),
    pageIndex: signal(0),
    pageSize: signal(10),
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
    columns: [{ header: 'Name', render: r => r.name }],
    getRowKey: r => r.name,
    rowState: () => signal<SignalListRowState>({ warning: true, message: 'plain that should be overridden' }).asReadonly(),
  };
}

describe('SignalListComponent rowState __rowMessage template', () => {
  it('projects the custom message template instead of the declarative message', () => {
    const fixture = TestBed.createComponent(RowMessageTemplateHost);
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('[data-test="row-message"]');
    expect(msg).not.toBeNull();
    expect(msg.querySelector('[data-test="custom-msg"]')?.textContent).toContain('custom for one');
    expect(msg.textContent).not.toContain('plain that should be overridden');
  });
});

@Component({
  standalone: true,
  imports: [SignalListComponent],
  template: `<app-signal-list [config]="config" />`
})
class SelectAllHost {
  items = signal([{ name: 'one' }, { name: 'two' }, { name: 'three' }]);
  selected = signal<ReadonlySet<string>>(new Set());
  toggled = 0;
  config: SignalListConfig<{ name: string }> = {
    pagedItems: this.items.asReadonly(),
    totalFilteredResults: signal(3).asReadonly(),
    totalPages: signal(1).asReadonly(),
    pageIndex: signal(0),
    pageSize: signal(10),
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
    columns: [
      {
        header: '', key: 'sel', kind: 'checkbox', render: () => '',
        checkbox: {
          selectedKeys: this.selected,
          selectAll: {
            selectableCount: () => 3,
            onToggle: () => { this.toggled++; },
          },
        },
      },
      { header: 'Name', key: 'name', render: r => r.name },
    ],
    getRowKey: r => r.name,
  };
}

describe('SignalListComponent checkbox select-all header', () => {
  it('renders a tri-state select-all header checkbox for a checkbox column with selectAll', () => {
    const fixture = TestBed.createComponent(SelectAllHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="select-all"]')).not.toBeNull();
  });

  it('is unchecked + not indeterminate when nothing is selected', () => {
    const fixture = TestBed.createComponent(SelectAllHost);
    fixture.detectChanges();
    const cb = fixture.nativeElement.querySelector('[data-test="select-all"]') as HTMLInputElement;
    expect(cb.checked).toBe(false);
    expect(cb.indeterminate).toBe(false);
  });

  it('is indeterminate when some but not all rows are selected', () => {
    const fixture = TestBed.createComponent(SelectAllHost);
    fixture.componentInstance.selected.set(new Set(['one']));
    fixture.detectChanges();
    const cb = fixture.nativeElement.querySelector('[data-test="select-all"]') as HTMLInputElement;
    expect(cb.checked).toBe(false);
    expect(cb.indeterminate).toBe(true);
  });

  it('is checked when all selectable rows are selected', () => {
    const fixture = TestBed.createComponent(SelectAllHost);
    fixture.componentInstance.selected.set(new Set(['one', 'two', 'three']));
    fixture.detectChanges();
    const cb = fixture.nativeElement.querySelector('[data-test="select-all"]') as HTMLInputElement;
    expect(cb.checked).toBe(true);
    expect(cb.indeterminate).toBe(false);
  });

  it('invokes onToggle when the header checkbox is clicked', () => {
    const fixture = TestBed.createComponent(SelectAllHost);
    fixture.detectChanges();
    const cb = fixture.nativeElement.querySelector('[data-test="select-all"]') as HTMLInputElement;
    cb.click();
    expect(fixture.componentInstance.toggled).toBe(1);
  });

  it('renders no select-all header when the checkbox binding omits selectAll', () => {
    const fixture = TestBed.createComponent(SelectAllHost);
    fixture.componentInstance.config = {
      ...fixture.componentInstance.config,
      columns: [
        { header: '', key: 'sel', kind: 'checkbox', render: () => '', checkbox: { selectedKeys: fixture.componentInstance.selected } },
        { header: 'Name', key: 'name', render: r => r.name },
      ],
    };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="select-all"]')).toBeNull();
  });
});

describe('SignalListComponent rowState blocked/deleting/busy (multiline-ops feedback)', () => {
  it('renders a "Deleting" bar and dims/locks the row when deleting', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.componentInstance.states['one'].set({ deleting: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="row-deleting"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="row-deleting"]').textContent).toContain('Deleting');
    const rows = fixture.nativeElement.querySelectorAll('[data-test="row"]');
    expect(rows[0].className).toContain('pointer-events-none');
  });

  it('dims and locks a blocked row', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.componentInstance.states['two'].set({ blocked: true });
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-test="row"]');
    expect(rows[1].className).toContain('opacity-60');
    expect(rows[1].className).toContain('pointer-events-none');
  });

  it('renders a busy spinner row when busy', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.componentInstance.states['one'].set({ busy: true, message: 'working' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="row-busy"]')).not.toBeNull();
  });
});

// Checklist-popup filter input (config.filterMultis / SignalListMultiFilter).
// Stack is the first consumer of this control; status is the second
// filterMultis entry on the same field-selector, elsewhere.
@Component({
  standalone: true,
  imports: [SignalListComponent],
  template: `<app-signal-list [config]="config" />`
})
class MultiFilterHost {
  items = signal([
    { name: 'one', stack: 'cflinuxfs4' },
    { name: 'two', stack: 'cflinuxfs5' },
  ]);
  pageIndex = signal(0);
  pageSize = signal(10);
  filterField = signal('stackName');
  selectedStacks = signal<string[] | null>(null);
  stackOptions = signal(['cflinuxfs4', 'cflinuxfs5', 'windows']);
  config: SignalListConfig<{ name: string; stack: string }> = {
    pagedItems: this.items.asReadonly(),
    totalFilteredResults: signal(2).asReadonly(),
    totalPages: signal(1).asReadonly(),
    pageIndex: this.pageIndex,
    pageSize: this.pageSize,
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
    columns: [
      { header: 'Name', key: 'name', render: r => r.name },
      { header: 'Stack', key: 'stackName', render: r => r.stack },
    ],
    getRowKey: r => r.name,
    nameFilter: signal(''),
    filterColumns: ['name', 'stackName'],
    filterField: this.filterField,
    filterMultis: [{
      field: 'stackName',
      options: this.stackOptions.asReadonly(),
      selected: this.selectedStacks,
    }],
  };
}

describe('SignalListComponent checklist-popup filter (filterMultis)', () => {
  function componentWith(fixture: ReturnType<typeof TestBed.createComponent<MultiFilterHost>>) {
    return fixture.debugElement.children[0].componentInstance as SignalListComponent<{ name: string; stack: string }>;
  }

  it('renders the checklist toggle instead of the text input when filterField matches a filterMultis entry', () => {
    const fixture = TestBed.createComponent(MultiFilterHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="multi-filter-toggle"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="name-filter"]')).toBeNull();
  });

  it('falls back to the text input when filterField does not match any filterMultis entry', () => {
    const fixture = TestBed.createComponent(MultiFilterHost);
    fixture.componentInstance.filterField.set('name');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="multi-filter-toggle"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="name-filter"]')).not.toBeNull();
  });

  describe('multiSummary() — the four button-label states', () => {
    it('reads "All (n)" when selected is null (the default)', () => {
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      expect(component.multiSummary(component.activeMulti()!)).toBe('All (3)');
    });

    it('reads "All (n)" when every option is explicitly selected', () => {
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.componentInstance.selectedStacks.set(['cflinuxfs4', 'cflinuxfs5', 'windows']);
      fixture.detectChanges();
      const component = componentWith(fixture);
      expect(component.multiSummary(component.activeMulti()!)).toBe('All (3)');
    });

    it('reads the bare value when exactly one option is selected', () => {
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.componentInstance.selectedStacks.set(['cflinuxfs4']);
      fixture.detectChanges();
      const component = componentWith(fixture);
      expect(component.multiSummary(component.activeMulti()!)).toBe('cflinuxfs4');
    });

    it('reads "x of y selected" for a partial pick', () => {
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.componentInstance.selectedStacks.set(['cflinuxfs4', 'windows']);
      fixture.detectChanges();
      const component = componentWith(fixture);
      expect(component.multiSummary(component.activeMulti()!)).toBe('2 of 3 selected');
    });

    it('reads "None — showing all" when the selection is explicitly emptied', () => {
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.componentInstance.selectedStacks.set([]);
      fixture.detectChanges();
      const component = componentWith(fixture);
      expect(component.multiSummary(component.activeMulti()!)).toBe('None — showing all');
    });
  });

  describe('toggleMultiOption() set math', () => {
    it('starting from null (all), unchecking one option produces the explicit remaining set', () => {
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.toggleMultiOption(component.activeMulti()!, 'windows');
      expect(fixture.componentInstance.selectedStacks()).toEqual(['cflinuxfs4', 'cflinuxfs5']);
    });

    it('checking every option back on collapses the selection to null, not an explicit full list', () => {
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.componentInstance.selectedStacks.set(['cflinuxfs4', 'cflinuxfs5']);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.toggleMultiOption(component.activeMulti()!, 'windows');
      expect(fixture.componentInstance.selectedStacks()).toBe(null);
    });

    it('unchecking the last remaining option leaves an explicit empty array, not null', () => {
      // Distinguishing [] from null is what lets the popup show the
      // "showing all" note instead of silently reverting to "all".
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.componentInstance.selectedStacks.set(['cflinuxfs4']);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.toggleMultiOption(component.activeMulti()!, 'cflinuxfs4');
      expect(fixture.componentInstance.selectedStacks()).toEqual([]);
    });

    it('resets pageIndex to 0', () => {
      const fixture = TestBed.createComponent(MultiFilterHost);
      fixture.componentInstance.pageIndex.set(3);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.toggleMultiOption(component.activeMulti()!, 'windows');
      expect(fixture.componentInstance.pageIndex()).toBe(0);
    });
  });

  it('shows the "Nothing selected — showing all" note in the popup when the selection is explicitly empty', () => {
    const fixture = TestBed.createComponent(MultiFilterHost);
    fixture.componentInstance.selectedStacks.set([]);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-test="multi-filter-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nothing selected — showing all');
  });

  it('toggling a checkbox in the popup updates the selection', () => {
    const fixture = TestBed.createComponent(MultiFilterHost);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-test="multi-filter-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    boxes[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedStacks()).toEqual(['cflinuxfs5', 'windows']);
  });

  it('closes the popup on the Close button and on any click outside the control', () => {
    const fixture = TestBed.createComponent(MultiFilterHost);
    fixture.detectChanges();
    const component = componentWith(fixture);
    (fixture.nativeElement.querySelector('[data-test="multi-filter-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.multiPopupOpen()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(component.multiPopupOpen()).toBe(false);
  });

  it('Escape closes the popup — the same affordance the text input it replaces offers', () => {
    const fixture = TestBed.createComponent(MultiFilterHost);
    fixture.detectChanges();
    const component = componentWith(fixture);
    const wrap = fixture.nativeElement.querySelector('[data-test="multi-filter-wrap"]') as HTMLElement;
    (wrap.querySelector('[data-test="multi-filter-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.multiPopupOpen()).toBe(true);

    wrap.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(component.multiPopupOpen()).toBe(false);
  });

  it('changing filterField closes an open popup', () => {
    const fixture = TestBed.createComponent(MultiFilterHost);
    fixture.detectChanges();
    const component = componentWith(fixture);
    (fixture.nativeElement.querySelector('[data-test="multi-filter-toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.multiPopupOpen()).toBe(true);
    component.onFilterFieldChange('name');
    expect(component.multiPopupOpen()).toBe(false);
  });
});

// Range-comparison filter input (config.filterRanges / SignalListRangeFilter).
// Mirrors the checklist-popup fixture above; lastRefreshedAt is the first
// consumer of this control.
@Component({
  standalone: true,
  imports: [SignalListComponent],
  template: `<app-signal-list [config]="config" />`
})
class RangeFilterHost {
  items = signal([
    { name: 'one', lastRefreshedAt: '2026-05-01' },
    { name: 'two', lastRefreshedAt: '2026-06-01' },
  ]);
  pageIndex = signal(0);
  pageSize = signal(10);
  filterField = signal('lastRefreshedAt');
  selectedRange = signal<SignalListRangeValue | null>(null);
  config: SignalListConfig<{ name: string; lastRefreshedAt: string }> = {
    pagedItems: this.items.asReadonly(),
    totalFilteredResults: signal(2).asReadonly(),
    totalPages: signal(1).asReadonly(),
    pageIndex: this.pageIndex,
    pageSize: this.pageSize,
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
    columns: [
      { header: 'Name', key: 'name', render: r => r.name },
      { header: 'Last Refreshed', key: 'lastRefreshedAt', render: r => r.lastRefreshedAt },
    ],
    getRowKey: r => r.name,
    nameFilter: signal(''),
    filterColumns: ['name', 'lastRefreshedAt'],
    filterField: this.filterField,
    filterRanges: [{
      field: 'lastRefreshedAt',
      valueType: 'date',
      selected: this.selectedRange,
    }],
  };
}

describe('SignalListComponent range filter (filterRanges)', () => {
  function componentWith(fixture: ReturnType<typeof TestBed.createComponent<RangeFilterHost>>) {
    return fixture.debugElement.children[0].componentInstance as SignalListComponent<{ name: string; lastRefreshedAt: string }>;
  }

  it('activeRange resolves when filterField names a range field, activeMulti stays undefined', () => {
    const fixture = TestBed.createComponent(RangeFilterHost);
    fixture.detectChanges();
    const component = componentWith(fixture);
    expect(component.activeRange()?.field).toBe('lastRefreshedAt');
    expect(component.activeMulti()).toBeUndefined();
  });

  it('updateRange collapses an empty primary bound to null (no constraint)', () => {
    const fixture = TestBed.createComponent(RangeFilterHost);
    fixture.detectChanges();
    const component = componentWith(fixture);
    const fr = component.activeRange()!;
    component.updateRange(fr, { op: 'gte', a: '2026-05-01' });
    expect(fixture.componentInstance.selectedRange()).toEqual({ op: 'gte', a: '2026-05-01' });
    component.updateRange(fr, { a: '' });
    expect(fixture.componentInstance.selectedRange()).toBe(null);
  });

  it('updateRange resets to page 0', () => {
    const fixture = TestBed.createComponent(RangeFilterHost);
    fixture.componentInstance.pageIndex.set(3);
    fixture.detectChanges();
    const component = componentWith(fixture);
    component.updateRange(component.activeRange()!, { op: 'gte', a: '2026-05-01' });
    expect(fixture.componentInstance.pageIndex()).toBe(0);
  });

  it('hasActiveFilter sees a non-null range selection and Clear resets it', () => {
    const fixture = TestBed.createComponent(RangeFilterHost);
    fixture.detectChanges();
    const component = componentWith(fixture);
    fixture.componentInstance.selectedRange.set({ op: 'lt', a: '2026-01-01' });
    expect(component.hasActiveFilter()).toBe(true);
    fixture.componentInstance.selectedRange.set(null);
    expect(component.hasActiveFilter()).toBe(false);
  });

  it('rangeSummary renders Any / single-bound / between forms', () => {
    const fixture = TestBed.createComponent(RangeFilterHost);
    fixture.detectChanges();
    const component = componentWith(fixture);
    const fr = component.activeRange()!;
    expect(component.rangeSummary(fr)).toBe('Any');

    fixture.componentInstance.selectedRange.set({ op: 'gte', a: '2026-05-01' });
    expect(component.rangeSummary(fr)).toBe('≥ 2026-05-01');

    fixture.componentInstance.selectedRange.set({ op: 'between', a: '2026-05-01', b: '2026-06-01' });
    expect(component.rangeSummary(fr)).toBe('2026-05-01 – 2026-06-01');
  });

  // Reproduces the real UI sequence: the "between" <select> and the two
  // <input> bounds each fire their own (change) event, so op and a/b land
  // in SEPARATE updateRange() calls — never merged in one patch like the
  // collapse test above. An op-only patch must survive so the template's
  // between-branch gate (`selected()?.op === 'between'`) can ever see the
  // op and render the second input + inclusive checkboxes.
  describe('updateRange sequence: pick "between" before typing any bound', () => {
    it('(a) op-only patch to "between" with empty bounds stores a non-null selection with op "between"', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { op: 'between' });
      expect(fixture.componentInstance.selectedRange()).toEqual({ op: 'between', a: '' });
      expect(component.hasActiveFilter()).toBe(false);
    });

    it('(b) then typing the first bound keeps op "between" (not reset to gte)', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { op: 'between' });
      component.updateRange(fr, { a: '2026-05-01' });
      expect(fixture.componentInstance.selectedRange()).toEqual({ op: 'between', a: '2026-05-01' });
      expect(component.hasActiveFilter()).toBe(false);
    });

    it('(c) then typing the second bound completes the range and activates the filter', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { op: 'between' });
      component.updateRange(fr, { a: '2026-05-01' });
      component.updateRange(fr, { b: '2026-06-01' });
      expect(fixture.componentInstance.selectedRange()).toEqual({ op: 'between', a: '2026-05-01', b: '2026-06-01' });
      expect(component.hasActiveFilter()).toBe(true);
    });

    it('(d) clearing both bounds one at a time collapses back to null', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { op: 'between' });
      component.updateRange(fr, { a: '2026-05-01' });
      component.updateRange(fr, { b: '2026-06-01' });
      component.updateRange(fr, { a: '' });
      expect(fixture.componentInstance.selectedRange()).toEqual({ op: 'between', a: '', b: '2026-06-01' });
      component.updateRange(fr, { b: '' });
      expect(fixture.componentInstance.selectedRange()).toBe(null);
    });
  });

  // Relative bound modes ("older than N days / business days"): the mode
  // select, count input, working-day toggles, and holiday count each fire
  // their own change event — same separate-events discipline as the
  // between sequence above.
  describe('relative bound modes', () => {
    it('a mode-only patch stores the mode without collapsing to null', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.updateRange(component.activeRange()!, { mode: 'days' });
      expect(fixture.componentInstance.selectedRange()).toEqual({ op: 'gte', a: '', mode: 'days' });
      expect(component.hasActiveFilter()).toBe(false);
    });

    it('switching mode clears the bounds but keeps the op — a date is not a count', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { op: 'lt' });
      component.updateRange(fr, { a: '2026-05-01' });
      component.updateRange(fr, { mode: 'days' });
      expect(fixture.componentInstance.selectedRange()).toEqual({ op: 'lt', a: '', mode: 'days' });
    });

    it('switching to businessDays seeds a Mon–Fri working week', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      component.updateRange(component.activeRange()!, { mode: 'businessDays' });
      expect(fixture.componentInstance.selectedRange()?.workingDays).toEqual([1, 2, 3, 4, 5]);
    });

    it('toggleWorkingDay flips membership in both directions', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { mode: 'businessDays' });
      component.toggleWorkingDay(fr, 5); // Friday off
      expect(fixture.componentInstance.selectedRange()?.workingDays).toEqual([1, 2, 3, 4]);
      component.toggleWorkingDay(fr, 0); // Sunday on
      expect(fixture.componentInstance.selectedRange()?.workingDays).toEqual([1, 2, 3, 4, 0]);
    });

    it('full event sequence: mode, then count, then toggles, then holidays', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { op: 'lt' });
      component.updateRange(fr, { mode: 'businessDays' });
      expect(component.hasActiveFilter()).toBe(false); // no count yet
      component.updateRange(fr, { a: '30' });
      expect(component.hasActiveFilter()).toBe(true);
      component.toggleWorkingDay(fr, 5);
      component.updateRange(fr, { holidayCount: 2 });
      expect(fixture.componentInstance.selectedRange()).toEqual({
        op: 'lt', a: '30', mode: 'businessDays', workingDays: [1, 2, 3, 4], holidayCount: 2,
      });
      expect(component.hasActiveFilter()).toBe(true);
    });

    it('the last working day cannot be toggled off — a 7-day weekend is refused', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { mode: 'businessDays' });
      component.updateRange(fr, { a: '30' });
      for (const day of [1, 2, 3, 4]) component.toggleWorkingDay(fr, day);
      expect(fixture.componentInstance.selectedRange()?.workingDays).toEqual([5]);
      component.toggleWorkingDay(fr, 5); // refused: would empty the working week
      expect(fixture.componentInstance.selectedRange()?.workingDays).toEqual([5]);
      expect(component.hasActiveFilter()).toBe(true);
    });

    it('clearing the count in a relative range keeps mode, week, and holidays', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { mode: 'businessDays' });
      component.updateRange(fr, { a: '30' });
      component.toggleWorkingDay(fr, 5);
      component.updateRange(fr, { holidayCount: 2 });
      component.updateRange(fr, { a: '' }); // clear to retype
      expect(fixture.componentInstance.selectedRange()).toEqual({
        op: 'gte', a: '', mode: 'businessDays', workingDays: [1, 2, 3, 4], holidayCount: 2,
      });
      expect(component.hasActiveFilter()).toBe(false); // inert, but config survives
    });

    it('holidayCount patches are floored to non-negative integers', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      component.updateRange(fr, { mode: 'businessDays' });
      component.updateRange(fr, { holidayCount: 1.5 });
      expect(fixture.componentInstance.selectedRange()?.holidayCount).toBe(1);
      component.updateRange(fr, { holidayCount: -2 });
      expect(fixture.componentInstance.selectedRange()?.holidayCount).toBe(0);
      component.updateRange(fr, { holidayCount: Number.NaN });
      expect(fixture.componentInstance.selectedRange()?.holidayCount).toBe(0);
    });

    it('rangeSummary renders relative forms', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;

      fixture.componentInstance.selectedRange.set({ op: 'lt', a: '90', mode: 'days' });
      expect(component.rangeSummary(fr)).toBe('older than 90 days');

      fixture.componentInstance.selectedRange.set({ op: 'gte', a: '30', mode: 'businessDays', workingDays: [1, 2, 3, 4, 5] });
      expect(component.rangeSummary(fr)).toBe('within 30 business days');

      fixture.componentInstance.selectedRange.set({ op: 'gt', a: '7', mode: 'days' });
      expect(component.rangeSummary(fr)).toBe('newer than 7 days');

      fixture.componentInstance.selectedRange.set({ op: 'between', a: '90', b: '30', mode: 'days' });
      expect(component.rangeSummary(fr)).toBe('90 – 30 days ago');
    });

    it('resolvedDayLabel names the resolved day for a complete relative bound, null otherwise', () => {
      // Frozen clock: the component and the expectation must see the same
      // "today", or a run straddling local midnight flakes.
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 10, 12, 0)); // Mon 2026-08-10
      try {
        const fixture = TestBed.createComponent(RangeFilterHost);
        fixture.detectChanges();
        const component = componentWith(fixture);
        const fr = component.activeRange()!;

        fixture.componentInstance.selectedRange.set({ op: 'lt', a: '2026-05-01' });
        expect(component.resolvedDayLabel(fr, 'a')).toBeNull();

        fixture.componentInstance.selectedRange.set({ op: 'lt', a: '1', mode: 'days' });
        const expected = new Date(2026, 7, 9)
          .toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        expect(component.resolvedDayLabel(fr, 'a')).toBe(expected);

        fixture.componentInstance.selectedRange.set({ op: 'lt', a: '', mode: 'days' });
        expect(component.resolvedDayLabel(fr, 'a')).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it('holiday warning is singular for one bound, plural with per-bound remedies for between', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      (fixture.nativeElement.querySelector('[data-test="range-filter-toggle"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      const fr = component.activeRange()!;
      component.updateRange(fr, { mode: 'businessDays' });
      fixture.detectChanges();
      const warnText = () =>
        (fixture.nativeElement.querySelector('[data-test="range-holiday-warning"]') as HTMLElement).textContent!.replace(/\s+/g, ' ').trim();
      expect(warnText()).toContain('the resolved date');
      expect(warnText()).not.toContain('either');

      component.updateRange(fr, { op: 'between' });
      fixture.detectChanges();
      expect(warnText()).toContain('either resolved date');
      expect(warnText()).toContain('holiday count shifts both dates');
    });

    it('opLabel wording follows the mode', () => {
      const fixture = TestBed.createComponent(RangeFilterHost);
      fixture.detectChanges();
      const component = componentWith(fixture);
      const fr = component.activeRange()!;
      expect(component.opLabel(fr, 'lt')).toBe('before');
      fixture.componentInstance.selectedRange.set({ op: 'lt', a: '90', mode: 'days' });
      expect(component.opLabel(fr, 'lt')).toBe('older than');
      expect(component.opLabel(fr, 'gte')).toBe('within');
    });
  });
});
