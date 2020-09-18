import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { ApplicationStateData, ApplicationStateService } from '../../../../../services/application-state.service';

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
    private store: Store<CFAppState>,
    private appStateService: ApplicationStateService,


  ) {
    super();
  }

  ngOnInit() {
    const applicationState = this.appStateService.get(this.row.entity, null);
    this.fetchAppState$ = ApplicationService.getApplicationState(
      this.appStateService,
      this.row.entity,
      this.row.metadata.guid,
      this.row.entity.cfGuid)
      .pipe(
        startWith(applicationState)
      );
  }

}
