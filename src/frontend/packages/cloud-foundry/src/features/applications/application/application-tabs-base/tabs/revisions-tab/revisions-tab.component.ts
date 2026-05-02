import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';

import { SignalListComponent, SignalListConfig, TailwindDialogService } from '@stratosui/core';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { RevisionsSignalConfigService } from '../../../../../../shared/components/list/list-types/revisions/revisions-signal-config.service';
import {
  RollbackDialogComponent,
  RollbackDialogResult,
} from '../../../../../../shared/components/dialogs/rollback-dialog/rollback-dialog.component';
import type { RevisionRow } from '../../../../../../shared/services/revisions.service';

// Signal-native Revisions tab for the App detail page.
// Shows the list of revisions for this app with a rollback action.
// Banners appear when the feature is disabled or deployed-revision detection fails.
@Component({
  selector: 'app-revisions-tab',
  templateUrl: './revisions-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SignalListComponent,
  ],
})
export class RevisionsTabComponent {
  private readonly data = inject(AppDetailDataService);
  private readonly revsConfig = inject(RevisionsSignalConfigService);
  private readonly dialog = inject(TailwindDialogService);

  readonly listConfig: WritableSignal<SignalListConfig<RevisionRow> | undefined> = signal(undefined);
  readonly featureEnabled = computed(() => this.revsConfig.featureEnabled());
  readonly deployedUnknown = computed(() => this.revsConfig.deployedUnknown());
  readonly rollingBackGuid: WritableSignal<string | null> = signal(null);

  constructor() {
    this.revsConfig.initialize(this.data.cnsiGuid, this.data.appGuid);
    void this.revsConfig.loadAll();

    this.listConfig.set({
      pagedItems: this.revsConfig.view.pagedItems,
      totalFilteredResults: this.revsConfig.view.totalFilteredResults,
      totalPages: this.revsConfig.view.totalPages,
      pageIndex: this.revsConfig.pageIndex,
      pageSize: this.revsConfig.pageSize,
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Revision',
          key: 'version',
          sortField: 'version',
          kind: 'text',
          render: (r: RevisionRow) => `#${r.version}${r.deployed ? ' ★' : ''}`,
          widthHint: '7rem',
        },
        {
          header: 'Description',
          key: 'description',
          sortField: 'description',
          kind: 'text',
          render: (r: RevisionRow) => r.description ?? '',
          widthHint: '24rem',
        },
        {
          header: 'Deployable',
          key: 'deployable',
          sortField: 'deployable',
          kind: 'text',
          render: (r: RevisionRow) => (r.deployable ? 'Yes' : 'No'),
          widthHint: '7rem',
        },
        {
          header: 'Created',
          key: 'created_at',
          sortField: 'created_at',
          render: (r: RevisionRow) => RevisionsTabComponent.formatDate(r.created_at),
          widthHint: '12rem',
        },
        {
          header: 'Actions',
          key: 'actions',
          kind: 'actions',
          render: (_r: RevisionRow) => '',
          widthHint: '8rem',
          actions: (r: RevisionRow) => [
            {
              label: r.deployed ? 'Currently Deployed' : 'Rollback',
              icon: 'restore',
              disabled: r.deployed || this.rollingBackGuid() !== null,
              invoke: () => this.rollback(r),
            },
          ],
        },
      ],
      getRowKey: (r: RevisionRow) => r.guid,
      emptyMessage: 'No revisions yet. They appear here after the first deployment.',
      emptyFilterMessage: 'No revisions match the current filters.',
      loadingMessage: 'Loading revisions…',
      pageSizeOptions: {
        table: [10, 25, 50],
        card: [6, 12, 24],
      },
      nameFilter: this.revsConfig.nameFilter,
      onRefresh: () => this.revsConfig.refresh(),
      onClear: () => this.revsConfig.clearFilters(),
      viewMode: this.revsConfig.viewMode,
      sort: this.revsConfig.sort,
    });
  }

  rollback(row: RevisionRow): void {
    if (row.deployed) return;
    if (this.rollingBackGuid() !== null) return;
    this.rollingBackGuid.set(row.guid);

    const ref = this.dialog.open<RollbackDialogComponent, unknown, RollbackDialogResult>(
      RollbackDialogComponent,
      {
        data: { revision: row, cnsi: this.data.cnsiGuid, appGuid: this.data.appGuid },
      },
    );
    ref.afterClosed().subscribe((r) => {
      this.rollingBackGuid.set(null);
      if (r?.stateChanged) void this.revsConfig.refresh();
    });
  }

  static formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
