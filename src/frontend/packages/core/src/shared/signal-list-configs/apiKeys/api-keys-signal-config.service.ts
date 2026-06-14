import { Injectable, Injector, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ApiKey } from '@stratosui/store';

import { ApiKeysDataService } from '../../../features/api-keys/api-keys-data.service';
import { SortSpec, ViewPipeline } from '../../../features/endpoints/endpoints-page/endpoints-signal-config.service';
import { ConfirmationDialogConfig } from '../../components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../components/confirmation-dialog.service';
import { ListStateStore } from '../../components/signal-list/list-state-store.service';
import { SignalListColumn, SignalListConfig, SignalListRowAction } from '../../components/signal-list/signal-list.component';

// Signal-native config for the API Keys page list. Replaces
// ApiKeyListConfigService + ApiKeyDataSource (ngrx ListDataSource over
// GetAllApiKeys / ApiKeyEffect). Reads rows from ApiKeysDataService,
// filters by comment substring, and delegates the row Delete action
// to the same data service so deletes are optimistic.
@Injectable()
export class ApiKeysSignalConfigService {
  private readonly data = inject(ApiKeysDataService);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('api-keys', {
    viewMode: 'table',
    pageSize: [10, 12],
    pageIndex: [0, 0],
    // Default mirrors the legacy comment-asc-via-desc-then-reverse
    // contortion: just sort comments ascending by default.
    sort: [
      { field: 'comment', direction: 'asc' },
      { field: 'comment', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(r: ApiKey) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<ApiKey>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: ApiKey) => unknown>> = signal(new Map());

  view!: ViewPipeline<ApiKey>;

  constructor() {
    this.view = new ViewPipeline<ApiKey>(
      this.data.apiKeys,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((k: ApiKey) => {
          if (!q) return true;
          return (k.comment ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  buildConfig(): SignalListConfig<ApiKey> {
    return {
      pagedItems: this.view.pagedItems,
      totalFilteredResults: this.view.totalFilteredResults,
      totalPages: this.view.totalPages,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      isAnyLoading: computed(() => this.data.isLoading()),
      errorsByCnsi: signal(new Map()),
      columns: this.buildColumns(),
      getRowKey: (k: ApiKey) => k.guid,
      emptyMessage: 'You have no API keys',
      emptyFilterMessage: 'No API keys match the current filter',
      loadingMessage: 'Loading API keys…',
      nameFilter: this.nameFilter,
      onRefresh: () => this.data.refresh(),
      onClear: () => this.clearFilters(),
      sort: this.sort,
    };
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: ApiKey) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  private buildColumns(): SignalListColumn<ApiKey>[] {
    return [
      {
        header: 'Description', key: 'comment', sortField: 'comment',
        kind: 'text',
        render: (k: ApiKey) => k.comment ?? '',
      },
      {
        header: 'Last Used', key: 'lastUsed', sortField: 'last_used',
        kind: 'text',
        render: (k: ApiKey) => k.last_used ? new Date(k.last_used).toLocaleString() : '',
        widthHint: '14rem',
      },
      {
        header: '', key: 'actions',
        kind: 'actions',
        actions: (k: ApiKey): readonly SignalListRowAction<ApiKey>[] => [
          {
            label: 'Delete', icon: 'delete', danger: true,
            invoke: () => this.confirmDelete(k),
          },
        ],
        render: () => '',
        widthHint: '3rem',
      },
    ];
  }

  private confirmDelete(key: ApiKey): void {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Key',
      'Are you sure?',
      'Delete',
      true,
    );
    this.confirmDialog.open(confirmation, async () => {
      await this.data.remove(key.guid);
    });
  }
}
