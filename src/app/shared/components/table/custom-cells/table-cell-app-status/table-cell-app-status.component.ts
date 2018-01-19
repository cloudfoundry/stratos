import { tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ActivatedRoute } from '@angular/router';
import { EntityService } from '../../../../../core/entity-service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationSchema, GetApplication } from '../../../../../store/actions/application.actions';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TableCellCustom } from '../../table-cell/table-cell-custom';
import {
  ApplicationStateService,
  ApplicationStateData,
} from './../../../application-state/application-state.service';
import { Subscription } from 'rxjs/Subscription';
import { selectEntity } from '../../../../../store/selectors/api.selectors';
import { AppStatsSchema, AppStatSchema } from '../../../../../store/types/app-metadata.types';
import { getPaginationPages } from '../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { GetAppStatsAction } from '../../../../../store/actions/app-metadata.actions';

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
