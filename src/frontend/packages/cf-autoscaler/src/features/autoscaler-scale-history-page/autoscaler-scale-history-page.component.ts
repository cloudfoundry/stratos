import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { CustomIconComponent, PageHeaderModule, SignalListComponent, SignalListConfig, SignalListPillColor } from '@stratosui/core';

import {
  CfAppAutoscalerEventsSignalConfigService,
} from '../../shared/list-types/app-autoscaler-event/cf-app-autoscaler-events-signal-config.service';
import { AppAutoscalerEvent } from '../../store/app-autoscaler.types';

@Component({
  selector: 'app-autoscaler-scale-history-page',
  templateUrl: './autoscaler-scale-history-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderModule,
    SignalListComponent,
    CustomIconComponent,
  ]
})
export class AutoscalerScaleHistoryPageComponent implements OnInit {
  applicationService = inject(ApplicationService);
  private cdr = inject(ChangeDetectorRef);
  private eventsConfig = inject(CfAppAutoscalerEventsSignalConfigService);

  parentUrl: string;
  applicationName$!: Observable<string | null>;

  public listConfig: WritableSignal<SignalListConfig<AppAutoscalerEvent> | undefined> = signal(undefined);

  constructor() {
    this.parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;

    this.eventsConfig.initialize(this.applicationService.cfGuid, this.applicationService.appGuid);

    this.listConfig.set({
      pagedItems: this.eventsConfig.view.pagedItems,
      totalFilteredResults: this.eventsConfig.view.totalFilteredResults,
      totalPages: this.eventsConfig.view.totalPages,
      pageIndex: this.eventsConfig.pageIndex,
      pageSize: this.eventsConfig.pageSize,
      isAnyLoading: computed(() => !this.eventsConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Timestamp', key: 'timestamp', sortField: 'timestamp',
          render: (e: AppAutoscalerEvent) => AutoscalerScaleHistoryPageComponent.formatTimestamp(e.timestamp),
          widthHint: '14rem',
        },
        {
          header: 'Status', key: 'status', sortField: 'status',
          kind: 'pill',
          render: (e: AppAutoscalerEvent) => AutoscalerScaleHistoryPageComponent.statusLabel(e.status),
          pillColor: (e: AppAutoscalerEvent) => AutoscalerScaleHistoryPageComponent.statusPill(e.status),
          widthHint: '8rem',
        },
        {
          header: 'Type', key: 'type', sortField: 'scaling_type',
          render: (e: AppAutoscalerEvent) => e.scaling_type === 0 ? 'dynamic' : 'schedule',
          widthHint: '8rem',
        },
        {
          header: 'Instance Change', key: 'change',
          render: (e: AppAutoscalerEvent) => AutoscalerScaleHistoryPageComponent.changeLabel(e),
          widthHint: '10rem',
        },
        {
          header: 'Action', key: 'action',
          render: (e: AppAutoscalerEvent) => AutoscalerScaleHistoryPageComponent.actionLabel(e),
          widthHint: '24rem',
        },
        {
          header: 'Error', key: 'error',
          render: (e: AppAutoscalerEvent) => e.error || '',
          widthHint: '20rem',
        },
      ],
      getRowKey: (e: AppAutoscalerEvent) =>
        `${e.app_id}:${e.timestamp}:${e.status}:${e.scaling_type}`,
      emptyMessage: 'There are no scaling events',
      emptyFilterMessage: 'No events match the current filters',
      loadingMessage: 'Loading scaling events…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.eventsConfig.nameFilter,
      onRefresh: () => this.eventsConfig.refresh(),
      onClear: () => this.eventsConfig.clearFilters(),
      viewMode: this.eventsConfig.viewMode,
      sort: this.eventsConfig.sort,
    });
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
    void this.eventsConfig.loadAll();
    this.cdr.markForCheck();
  }

  // Autoscaler timestamps are nanoseconds since the unix epoch — divide
  // by 1e6 to get milliseconds for the JS Date constructor. Matches the
  // legacy DatePipe-based render at `entity.timestamp / 1000000`.
  static formatTimestamp(ts: number | null | undefined): string {
    if (ts == null) return '';
    const d = new Date(ts / 1_000_000);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
    });
  }

  // Status codes: 0 = succeeded, 1 = failed, 2 = ignored. Mirrors
  // TableCellAutoscalerEventStatusIconPipe — same labels, mapped to the
  // SignalList pill palette.
  static statusLabel(status: number): string {
    switch (status) {
      case 0: return 'succeeded';
      case 1: return 'failed';
      case 2: return 'ignored';
      default: return '';
    }
  }

  static statusPill(status: number): SignalListPillColor {
    switch (status) {
      case 0: return 'success';
      case 1: return 'danger';
      case 2: return 'warning';
      default: return 'neutral';
    }
  }

  // Instance Change column — only meaningful for status === 0
  // (succeeded). Legacy renderer used arrow icons; SignalList text
  // columns approximate with unicode arrows so the visual cue survives.
  static changeLabel(e: AppAutoscalerEvent): string {
    if (e.status !== 0) return '';
    const delta = e.new_instances - e.old_instances;
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
    return `${e.old_instances} ${arrow} ${e.new_instances}`;
  }

  // Mirrors the legacy ListConfig "action" column: when message is set,
  // show "+/-N instance(s) because <message>"; otherwise fall back to
  // the reason field.
  static actionLabel(e: AppAutoscalerEvent): string {
    if (e.message) {
      const change = e.new_instances - e.old_instances;
      const sign = change >= 0 ? '+' : '';
      return `${sign}${change} instance(s) because ${e.message}`;
    }
    return e.reason || '';
  }
}
