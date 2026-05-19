import { Component, Input, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { ApplicationStateComponent, TableCellCustom } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IApp } from '../../../../../../cf-api.types';
import { AppStatsDataRegistry } from '../../../../../../services/endpoint-data/app-stats-data.registry';
import { ApplicationStateData, ApplicationStateService } from '../../../../../services/application-state.service';

@Component({
  selector: 'app-table-cell-app-status',
  templateUrl: './table-cell-app-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ApplicationStateComponent
  ]
})
export class TableCellAppStatusComponent extends TableCellCustom<APIResource<IApp>> implements OnInit {
  private appStateService = inject(ApplicationStateService);
  private statsRegistry = inject(AppStatsDataRegistry);

  applicationState!: ApplicationStateData;
  @Input()
  set config(value: { hideIcon: boolean, initialStateOnly: boolean, }) {
    super.config = value;
    value = value || {
      hideIcon: false,
      initialStateOnly: false
    };
    this.hideIcon = value.hideIcon || false;
    this.initialStateOnly = value.initialStateOnly || false;
  }
  public fetchAppState$!: Observable<ApplicationStateData>;
  public hideIcon = false;
  public initialStateOnly = false;

  ngOnInit() {
    const stats = this.statsRegistry.acquire(this.row.entity.cfGuid, this.row.metadata.guid);
    const stateSignal = computed(() => this.appStateService.get(this.row.entity, stats.stats()));
    this.fetchAppState$ = toObservable(stateSignal);
    this.applicationState = this.appStateService.get(this.row.entity, null);
    stats.load().subscribe();
  }

}
