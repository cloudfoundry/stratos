import { ChangeDetectionStrategy, Component, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { format } from 'date-fns';
import { map } from 'rxjs/operators';

import {
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
} from '../../../../../../../core/src/shared/components/signal-list/signal-list.component';
import { HelmReleaseRevision } from '../../../workload.types';
import { HelmReleaseHelperService } from './../helm-release-helper.service';

// The history payload carries a `chart` block that the typed
// HelmReleaseRevision doesn't declare (the legacy table read it via `any`).
interface HelmReleaseHistoryRow extends HelmReleaseRevision {
  chart: { name: string; version: string; appVersion: string };
}

@Component({
  selector: 'app-helm-release-history-tab',
  templateUrl: './helm-release-history-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SignalListComponent,
  ]
})
export class HelmReleaseHistoryTabComponent {

  private readonly helmReleaseHelper = inject(HelmReleaseHelperService);

  // Newest revision first — matches the Helm CLI history ordering. Fixed
  // sort, no interactive re-sort (the legacy table offered none either).
  private readonly history: Signal<HelmReleaseHistoryRow[]> = toSignal(
    this.helmReleaseHelper.fetchReleaseHistory().pipe(
      map(history => ([...history] as HelmReleaseHistoryRow[]).sort((a, b) => b.revision - a.revision)),
    ),
    { initialValue: [] as HelmReleaseHistoryRow[] },
  );

  // fetchReleaseHistory emits exactly once; "loading" is simply "no rows yet".
  private readonly loading: Signal<boolean> = computed(() => this.history().length === 0);

  readonly pageSize: WritableSignal<number> = signal(50);
  readonly pageIndex: WritableSignal<number> = signal(0);

  private readonly pagedItems: Signal<HelmReleaseHistoryRow[]> = computed(() => {
    const size = this.pageSize();
    const idx = this.pageIndex();
    return this.history().slice(idx * size, idx * size + size);
  });
  private readonly totalFilteredResults: Signal<number> = computed(() => this.history().length);
  private readonly totalPages: Signal<number> = computed(() => {
    const size = this.pageSize();
    return size > 0 ? Math.max(1, Math.ceil(this.totalFilteredResults() / size)) : 1;
  });

  // Same six columns as the Helm CLI; widths track the legacy flex weights
  // (1:3:2:2:1:2) as percentages.
  private readonly columns: SignalListColumn<HelmReleaseHistoryRow>[] = [
    { header: 'Revision', key: 'revision', kind: 'text', widthHint: '9%', render: r => `${r.revision}` },
    { header: 'Updated', key: 'updated', kind: 'text', widthHint: '27%', render: r => format(new Date(r.last_deployed), 'PPPppp') },
    { header: 'Status', key: 'status', kind: 'text', widthHint: '18%', render: r => r.status },
    { header: 'Chart', key: 'chart', kind: 'text', widthHint: '18%', render: r => `${r.chart.name}-${r.chart.version}` },
    { header: 'App Version', key: 'app_version', kind: 'text', widthHint: '9%', render: r => r.chart.appVersion },
    { header: 'Description', key: 'description', kind: 'text', widthHint: '18%', render: r => r.description },
  ];

  readonly config: SignalListConfig<HelmReleaseHistoryRow> = {
    pagedItems: this.pagedItems,
    totalFilteredResults: this.totalFilteredResults,
    totalPages: this.totalPages,
    pageIndex: this.pageIndex,
    pageSize: this.pageSize,
    pageSizeOptions: [25, 50, 100],
    hidePagerWhenSingle: true,
    isAnyLoading: this.loading,
    errorsByCnsi: signal(new Map()),
    columns: this.columns,
    getRowKey: r => `${r.revision}`,
    emptyMessage: 'There is no release history',
    loadingMessage: 'Loading release history…',
  };

}
