import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListPillColor,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';

import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../shared/components/list/list-types/service-instance/cf-service-instances-signal-config.service';
import type { StServiceInstance } from '../../../services/endpoint-data/stratos-types';
import { extractHttpErrorMessage } from '../../../services/extract-error-message';

/**
 * ServiceInstancesComponent — service-catalog Instances tab on a service
 * offering detail page (/services/:endpointId/:serviceId/instances).
 * Signal-native rewrite mirroring the Stage 9c RoutesTab/ServicesTab
 * pattern, narrowed to the offering via
 * CfServiceInstancesSignalConfigService.initializeForOffering(cnsi, offeringGuid).
 *
 * Uses the same singleton signal config that drives the Services Wall
 * and the per-space tabs — extending it with a per-offering filter
 * matched the existing per-space pattern and avoided a parallel service.
 *
 * Per-row actions (only Delete today; Edit/Detach are out of scope until
 * the bind stepper migrates fully). Edit was navigation to the SI edit
 * stepper in legacy; offering-scoped detail page navigation will be
 * revisited if/when the SI detail page is built (parked per the slice
 * plan).
 */
@Component({
  selector: 'app-service-instances',
  templateUrl: './service-instances.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    SignalListComponent,
  ],
  providers: [DatePipe],
})
export class ServiceInstancesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly instancesConfig = inject(CfServiceInstancesSignalConfigService);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(TailwindSnackBarService);

  private readonly cfGuid: string = getIdFromRoute(this.route, 'endpointId');
  private readonly serviceGuid: string = getIdFromRoute(this.route, 'serviceId');

  // Loading projection: the wall config wires per-CNSI loading via the
  // orchestrator; for the per-offering single-CNSI variant the same
  // `isAnyLoading` Signal applies. Errors map: per-CNSI keyed via
  // orchestrator.errorsByCnsi.
  private readonly _isAnyLoading: Signal<boolean> = computed(() =>
    this.instancesConfig.orchestrator?.isAnyLoading() ?? false,
  );
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  listConfig: SignalListConfig<StServiceInstance> | undefined;

  ngOnInit(): void {
    this.instancesConfig.initializeForOffering(this.cfGuid, this.serviceGuid);

    const renderType = (si: StServiceInstance): string =>
      si.type === 'user-provided' ? 'User Provided' : 'Managed';

    const renderPlan = (si: StServiceInstance): string =>
      si.servicePlan?.name ?? '';

    const renderTags = (si: StServiceInstance): string => {
      const tags = si.tags ?? [];
      return tags.length === 0 ? '—' : tags.join(', ');
    };

    const renderLastOp = (si: StServiceInstance): string =>
      si.lastOperation?.state ?? '';

    const lastOpColor = (si: StServiceInstance): SignalListPillColor => {
      const state = (si.lastOperation?.state ?? '').toLowerCase();
      if (state === 'succeeded') return 'success';
      if (state === 'in progress') return 'warning';
      if (state === 'failed') return 'danger';
      return 'neutral';
    };

    const renderCreated = (si: StServiceInstance): string => {
      if (!si.createdAt) return '';
      const d = new Date(si.createdAt);
      if (Number.isNaN(d.getTime())) return si.createdAt;
      return d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });
    };

    const columns: SignalListColumn<StServiceInstance>[] = [
      {
        header: 'Name', key: 'name', sortField: 'name',
        render: (si) => si.name ?? '',
        widthHint: '14rem',
      },
      {
        header: 'Plan', key: 'plan', sortField: renderPlan,
        render: renderPlan,
        widthHint: '10rem',
      },
      {
        header: 'Last Operation', key: 'lastOp', sortField: renderLastOp,
        kind: 'pill',
        pillColor: lastOpColor,
        render: renderLastOp,
        widthHint: '10rem',
      },
      {
        header: 'Tags', key: 'tags', sortField: renderTags,
        render: renderTags,
        widthHint: '14rem',
      },
      {
        header: 'Created', key: 'createdAt', sortField: 'createdAt',
        render: renderCreated,
        widthHint: '12rem',
      },
      {
        header: 'Type', key: 'type', sortField: renderType,
        render: renderType,
        widthHint: '8rem',
      },
      {
        header: '', key: 'actions',
        kind: 'actions',
        actions: this.buildRowActions,
        render: () => '',
        widthHint: '3rem',
      },
    ];

    this.listConfig = {
      pagedItems: this.instancesConfig.view.pagedItems,
      totalFilteredResults: this.instancesConfig.view.totalFilteredResults,
      totalPages: this.instancesConfig.view.totalPages,
      pageIndex: this.instancesConfig.pageIndex,
      pageSize: this.instancesConfig.pageSize,
      isAnyLoading: this._isAnyLoading,
      errorsByCnsi: this._errorsByCnsi.asReadonly(),
      columns,
      getRowKey: (si) => `${si.cnsiGuid}:${si.guid}`,
      emptyMessage: 'There are no service instances',
      emptyFilterMessage: 'No service instances match the current filter',
      loadingMessage: 'Loading service instances…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.instancesConfig.nameFilter,
      onRefresh: () => this.instancesConfig.refresh(),
      onClear: () => this.instancesConfig.clearFilters(),
      viewMode: this.instancesConfig.viewMode,
      sort: this.instancesConfig.sort,
    };

    this.instancesConfig.registerSortExtractor('plan', renderPlan);
    this.instancesConfig.registerSortExtractor('lastOp', renderLastOp);
    this.instancesConfig.registerSortExtractor('tags', renderTags);
    this.instancesConfig.registerSortExtractor('type', renderType);
    this.instancesConfig.registerFilterExtractor('name', (si) => si.name ?? '');

    void this.instancesConfig.loadAll();
  }

  // Per-row Delete with confirmation. Mirrors the wall's row-action
  // pattern. After the writeWithJob settles the config service refreshes
  // its source signal so the row vanishes.
  private readonly buildRowActions = (
    si: StServiceInstance,
  ): readonly SignalListRowAction<StServiceInstance>[] => {
    return [
      {
        label: 'Delete', icon: 'delete', danger: true,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Delete Service Instance',
            `Delete the service instance "${si.name}"? This cannot be undone and will detach any apps bound to it.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            try {
              await this.instancesConfig.deleteServiceInstance(si.cnsiGuid, si.guid);
            } catch (err: unknown) {
              this.snackBar.error(`Delete failed: ${extractHttpErrorMessage(err)}`);
            }
          });
        },
      },
    ];
  };
}
