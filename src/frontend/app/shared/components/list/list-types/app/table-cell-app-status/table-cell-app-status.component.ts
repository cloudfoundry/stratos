import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';

import { ApplicationService } from '../../../../../../features/applications/application.service';
import { AppState } from '../../../../../../store/app-state';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { ApplicationStateData, ApplicationStateService } from '../../../../application-state/application-state.service';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-app-status',
  templateUrl: './table-cell-app-status.component.html',
  styleUrls: ['./table-cell-app-status.component.scss'],
})
export class TableCellAppStatusComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input() row;
  applicationState: ApplicationStateData;
  @Input('config')
  set config(value: { hideIcon: boolean, initialStateOnly: boolean }) {
    value = value || {
      hideIcon: false,
      initialStateOnly: false
    };
    this.hideIcon = value.hideIcon || false;
    this.initialStateOnly = value.initialStateOnly || false;
  }
  public fetchAppState$: Observable<ApplicationStateData>;
  public hideIcon = false;
  public initialStateOnly = false
    ;
  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    super();
  }

  ngOnInit() {
    const applicationState = this.appStateService.get(this.row.entity, null);
    this.fetchAppState$ = ApplicationService.getApplicationState(
      this.store,
      this.appStateService,
      this.row.entity,
      this.row.metadata.guid,
      this.row.entity.cfGuid)
      .pipe(
        startWith(applicationState)
      );
  }

}
