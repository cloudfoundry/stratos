import { tap } from 'rxjs/operators';
import { AppMetadataProperties } from '../../../../../store/actions/app-metadata.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { ActivatedRoute } from '@angular/router';
import { EntityService } from '../../../../../core/entity-service';
import {
  ApplicationEnvVarsService,
} from '../../../../../features/applications/application/build-tab/application-env-vars.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationSchema, GetApplication } from '../../../../../store/actions/application.actions';
import { selector } from 'rxjs/operator/publish';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TableCellCustom } from '../../table-cell/table-cell-custom';
import {
  ApplicationStateService,
  ApplicationStateData,
} from './../../../application-state/application-state.service';
import { Subscription } from 'rxjs/Subscription';
import { selectEntity } from '../../../../../store/selectors/api.selectors';

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
    this.fetchAppState$ = this.store.select(
      selectEntity(AppMetadataProperties.INSTANCES, this.row && this.row.entity && this.row.entity.guid))
      // this.fetchAppState$ = this.store.select(selectMetadata('instances', this.row && this.row.entity && this.row.entity.guid))
      .pipe(
      tap(appInstances => {
        this.applicationState = this.appStateService.get(this.row && this.row.entity, appInstances ? appInstances : null);
      })
      ).subscribe();
  }

  ngOnDestroy() {
    this.fetchAppState$.unsubscribe();
  }



}
