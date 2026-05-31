import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SignalListComponent } from './signal-list.component';
import type { SignalListConfig, SignalListDropdown, SignalListDropdownOption, SignalListRowState } from './signal-list.component';
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

  it('tints the row by severity and uses the warning icon for warning state', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-test="row"]');
    expect(rows[0].className).toContain('border-yellow-500');
    const icon = fixture.nativeElement.querySelector('[data-test="row-message"] .material-icons');
    expect(icon.textContent).toContain('warning');
  });

  it('uses the info icon for info state and red tint for error', () => {
    const fixture = TestBed.createComponent(RowStateHost);
    fixture.componentInstance.states['one'].set({ info: true, message: 'just connecting' });
    fixture.componentInstance.states['two'].set({ error: true, message: 'bad' });
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-test="row"]');
    expect(rows[1].className).toContain('border-red-500');
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
    expect(rows[0].className).not.toContain('border-yellow-500');
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
