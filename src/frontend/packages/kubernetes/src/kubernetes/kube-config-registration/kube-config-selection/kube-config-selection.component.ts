import { ChangeDetectionStrategy, Component, Input, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { FileInputComponent } from '../../../../../core/src/shared/components/file-input/file-input.component';
import { CustomIconComponent } from '../../../../../core/src/shared/components/custom-material/custom-material.component';
import {
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListRowState,
} from '../../../../../core/src/shared/components/signal-list/signal-list.component';
import {
  SignalListCellTemplateDirective,
} from '../../../../../core/src/shared/components/signal-list/signal-list-cell-template.directive';
import { SnackBarService } from '../../../../../core/src/shared/services/snackbar.service';
import { KubeConfigHelper } from '../kube-config.helper';
import { KubeConfigFileCluster } from '../kube-config.types';
import { KubeConfigTableCertComponent } from './kube-config-table-cert/kube-config-table-cert.component';
import { KubeConfigTableSubTypeSelectComponent } from './kube-config-table-sub-type-select/kube-config-table-sub-type-select.component';
import { KubeConfigTableUserSelectComponent } from './kube-config-table-user-select/kube-config-table-user-select.component';

@Component({
  selector: 'app-kube-config-selection',
  templateUrl: './kube-config-selection.component.html',
  host: { class: 'flex flex-1' },
  providers: [
    KubeConfigHelper
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FileInputComponent,
    CustomIconComponent,
    SignalListComponent,
    SignalListCellTemplateDirective,
    KubeConfigTableSubTypeSelectComponent,
    KubeConfigTableUserSelectComponent,
    KubeConfigTableCertComponent,
  ]
})
export class KubeConfigSelectionComponent {

  @Input() applyStarted!: boolean;

  public helper = inject(KubeConfigHelper);
  private snackbarService = inject(SnackBarService);

  // Clusters as a signal. `helper.clusters$` filters to truthy arrays, so
  // this starts empty and populates once a kube config is parsed. Drives
  // the signal-list paging signals below; per-row mutations (_selected,
  // _state) don't change the array identity — those re-render via the
  // checkbox selection signal and per-row rowState signal respectively.
  private readonly clusters: Signal<KubeConfigFileCluster[]> = toSignal(
    this.helper.clusters$, { initialValue: [] as KubeConfigFileCluster[] }
  );

  // Selection mirror. signal-list's `kind: 'checkbox'` column owns a set of
  // selected row keys (_id), but the source of truth stays each cluster's
  // `_selected` flag — the helper's validity pass can force an invalid row
  // unselected. `clustersChanged()` rebuilds this set from those flags
  // (always a fresh Set ref) so the per-row checkboxes AND the tri-state
  // select-all header re-render zonelessly.
  readonly selectedKeys: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());

  // Inline name edit — signal-native, replacing the legacy
  // TableCellEditComponent + dataSource.startEdit/saveEdit/cancelEdit.
  readonly editRowId: WritableSignal<string | null> = signal(null);
  readonly editRowName: WritableSignal<string> = signal('');

  // Paging. Kube config files carry a handful of clusters, so this is
  // effectively single-page; hidePagerWhenSingle hides the pager chrome.
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly pageSize: WritableSignal<number> = signal(100);

  private readonly totalFilteredResults: Signal<number> = computed(() => this.clusters().length);
  private readonly totalPages: Signal<number> = computed(() => {
    const size = this.pageSize();
    return size > 0 ? Math.max(1, Math.ceil(this.totalFilteredResults() / size)) : 1;
  });
  private readonly pagedItems: Signal<KubeConfigFileCluster[]> = computed(() => {
    const size = this.pageSize();
    const idx = this.pageIndex();
    return this.clusters().slice(idx * size, idx * size + size);
  });

  public listConfig: SignalListConfig<KubeConfigFileCluster> = {
    pagedItems: this.pagedItems,
    totalFilteredResults: this.totalFilteredResults,
    totalPages: this.totalPages,
    pageIndex: this.pageIndex,
    pageSize: this.pageSize,
    hidePagerWhenSingle: true,
    isAnyLoading: signal(false),
    errorsByCnsi: signal(new Map()),
    getRowKey: (row: KubeConfigFileCluster) => row._id,
    // Per-row validation state: `_state` is a createSignalWrapper (callable
    // as a Signal). Stable per row, so reading it re-renders just that row
    // when the helper's validity pass updates the message/severity.
    rowState: (row: KubeConfigFileCluster) => row._state as unknown as Signal<SignalListRowState>,
    columns: this.buildColumns(),
  };

  // Is the import data valid? Bridged into the parent stepper's select-step
  // handle via valid$.
  private _valid = signal<boolean>(false);
  valid$ = toObservable(this._valid);

  constructor() {
    this.helper.clustersChanged = () => this.clustersChanged();
  }

  private buildColumns(): SignalListColumn<KubeConfigFileCluster>[] {
    return [
      {
        header: '', key: 'select', kind: 'checkbox',
        render: () => '',
        widthHint: '3rem',
        checkbox: {
          selectedKeys: this.selectedKeys,
          isDisabled: (row: KubeConfigFileCluster) => !!row._invalid,
          onToggle: (row: KubeConfigFileCluster, selected: boolean) => {
            row._selected = selected;
            this.helper.update(row);
          },
          selectAll: {
            selectableCount: () => this.clusters().filter(c => !c._invalid).length,
            onToggle: () => this.selectAllFilteredRows(),
          },
        },
      },
      {
        header: 'Name', key: 'name', kind: 'template', templateName: 'name',
        render: (row: KubeConfigFileCluster) => row.name,
      },
      {
        header: 'URL', key: 'url', kind: 'text',
        render: (row: KubeConfigFileCluster) => row.cluster.server,
      },
      {
        header: 'Type', key: 'type', kind: 'template', templateName: 'type',
        render: () => '',
      },
      {
        header: 'User', key: 'user', kind: 'template', templateName: 'user',
        render: (row: KubeConfigFileCluster) => row._user,
      },
      {
        header: 'Skip SSL Validation', key: 'cert', kind: 'template', templateName: 'cert',
        render: () => '',
      },
    ];
  }

  // ── Inline name edit ──────────────────────────────────────────────────
  startEdit(cluster: KubeConfigFileCluster): void {
    this.editRowName.set(cluster.name);
    this.editRowId.set(cluster._id);
  }

  saveEdit(cluster: KubeConfigFileCluster): void {
    cluster.name = this.editRowName();
    this.helper.update(cluster);
    this.editRowId.set(null);
  }

  cancelEdit(): void {
    this.editRowId.set(null);
  }

  // ── Selection ─────────────────────────────────────────────────────────
  // Tri-state select-all. Selects every valid row when not already all
  // selected (mirrors the legacy `selectAllFilteredRows`: indeterminate and
  // none both go to "all", all goes to "none"), re-validates each, then
  // rebuilds the selection mirror.
  selectAllFilteredRows(): void {
    const clusters = this.clusters();
    if (!clusters.length) {
      return;
    }
    const selectable = clusters.filter(c => !c._invalid).length;
    const target = this.selectedKeys().size < selectable;
    combineLatest(
      clusters.map(cluster => {
        if (!cluster._invalid) {
          cluster._selected = target;
          return this.helper.checkValidity(cluster).pipe(map(() => cluster));
        }
        return of(cluster);
      })
    ).pipe(take(1)).subscribe(() => this.clustersChanged());
  }

  // Save data for the next step to know the list of clusters to import.
  onNext = () => this.helper.clusters$.pipe(
    take(1),
    map(clusters => ({
      success: true,
      data: clusters
    }))
  );

  clustersParse(cluster: string) {
    this.snackbarService.hide();
    this.helper.parse(cluster).pipe(take(1)).subscribe(errorString => {
      if (errorString) {
        this.snackbarService.show(`Failed to load Kube Config: ${errorString}`, 'Close');
      }
    });
  }

  onEnter = () => {
    if (!this.applyStarted) {
      return;
    }
    // Handle back from review step (ensure newly registered endpoints are taken into account)
    this.helper.updateAll().pipe(take(1)).subscribe(() => { });
  };

  // Row changed event — rebuild the selection mirror from the per-row
  // `_selected` flags and update the next button. Uses `clusters$` (not the
  // signal) so it observes the freshly-emitted array: the helper invokes
  // this BEFORE pushing the new clusters during the initial parse.
  clustersChanged() {
    this.helper.clusters$.pipe(
      take(1)
    ).subscribe(clusters => {
      const keys = new Set<string>();
      clusters.forEach(c => {
        if (c._selected && !c._invalid) {
          keys.add(c._id);
        }
      });
      this.selectedKeys.set(keys);
      this.checkCanGoNext(clusters);
    });
  }

  // Can we proceed?
  checkCanGoNext(clusters: KubeConfigFileCluster[]) {
    let selected = 0;
    let okay = 0;
    clusters.forEach(i => {
      if (i._selected) {
        selected++;
        if (!i._invalid) {
          okay++;
        }
      }
    });

    // Must be at least one selected and they all must be okay to import
    this._valid.set(selected > 0 && selected === okay);
  }

}
