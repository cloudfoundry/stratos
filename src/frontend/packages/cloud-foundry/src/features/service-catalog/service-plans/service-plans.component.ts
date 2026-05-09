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
import { ActivatedRoute } from '@angular/router';

import {
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
} from '@stratosui/core';

import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import {
  CfServicePlansSignalConfigService,
} from '../../../shared/components/list/list-types/service-plans/cf-service-plans-signal-config.service';
import type { StServicePlan } from '../../../services/endpoint-data/stratos-types';

/**
 * ServicePlansComponent — service-offering Plans tab
 * (/marketplace/:endpointId/:serviceId/plans).
 *
 * Stage 9b-2: signal-native rewrite mirroring Stage 9b-1's offering
 * Instances tab. The ngrx-coupled ServicePlansListConfigService +
 * ServicePlansDataSource pair retired in favour of
 * CfServicePlansSignalConfigService (tab-scoped) reading from
 * ServiceCatalogDataService.servicePlansForOffering — a single bounded V3
 * fetch.
 *
 * Public column renders the V3 visibilityType as plain text; the legacy
 * embedded ServicePlanPublicComponent (with full plan-visibility tristate)
 * stays available for the bind-stepper's plan picker where the rich
 * affordance matters more.
 */
@Component({
  selector: 'app-service-plans',
  templateUrl: './service-plans.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SignalListComponent,
  ],
  providers: [
    DatePipe,
    CfServicePlansSignalConfigService,
  ],
})
export class ServicePlansComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly plansConfig = inject(CfServicePlansSignalConfigService);
  private readonly datePipe = inject(DatePipe);

  private readonly cfGuid: string = getIdFromRoute(this.route, 'endpointId');
  private readonly serviceGuid: string = getIdFromRoute(this.route, 'serviceId');

  private readonly _isAnyLoading: Signal<boolean> = computed(() => this.plansConfig.isLoading());
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());

  listConfig: SignalListConfig<StServicePlan> | undefined;

  ngOnInit(): void {
    this.plansConfig.initialize(this.cfGuid, this.serviceGuid);

    const formatDate = (iso: string): string => this.datePipe.transform(iso, 'medium') ?? iso ?? '';
    const columns: SignalListColumn<StServicePlan>[] = this.plansConfig.buildColumns(formatDate);

    this.listConfig = {
      pagedItems: this.plansConfig.view.pagedItems,
      totalFilteredResults: this.plansConfig.view.totalFilteredResults,
      totalPages: this.plansConfig.view.totalPages,
      pageIndex: this.plansConfig.pageIndex,
      pageSize: this.plansConfig.pageSize,
      isAnyLoading: this._isAnyLoading,
      errorsByCnsi: this._errorsByCnsi.asReadonly(),
      columns,
      getRowKey: (row) => `${row.cnsiGuid}:${row.guid}`,
      emptyMessage: 'There are no service plans',
      emptyFilterMessage: 'No service plans match the current filter',
      loadingMessage: 'Loading service plans…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.plansConfig.nameFilter,
      onRefresh: () => this.plansConfig.refresh(),
      onClear: () => this.plansConfig.clearFilters(),
      viewMode: this.plansConfig.viewMode,
      sort: this.plansConfig.sort,
    };
  }
}
