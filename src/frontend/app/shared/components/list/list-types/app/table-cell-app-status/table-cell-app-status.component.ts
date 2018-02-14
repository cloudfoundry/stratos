import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';

import { ApplicationService } from '../../../../../../features/applications/application.service';
import { AppState } from '../../../../../../store/app-state';
import { ApplicationStateData, ApplicationStateService } from '../../../../application-state/application-state.service';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';

@Component({
  selector: 'app-table-cell-app-status',
  templateUrl: './table-cell-app-status.component.html',
  styleUrls: ['./table-cell-app-status.component.scss'],
})
export class TableCellAppStatusComponent<T> extends TableCellCustom<T> implements OnInit, OnDestroy {

  @Input('row') row;
  applicationState: ApplicationStateData;
  fetchAppState$: Subscription;

  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    super();
  }

  ngOnInit() {
    this.applicationState = this.appStateService.get(this.row.entity, null);
    this.fetchAppState$ = ApplicationService.getApplicationState(
      this.store,
      this.appStateService,
      this.row.entity,
      this.row.entity.guid,
      this.row.entity.cfGuid)
      .do(appSate => this.applicationState = appSate)
      .subscribe();
  }

  ngOnDestroy() {
    this.fetchAppState$.unsubscribe();
  }

}
