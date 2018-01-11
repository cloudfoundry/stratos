import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { tap } from 'rxjs/operators';
/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { APIResource } from '../../../../../store/types/api.types';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { TableCellCustom } from '../../../table/table-cell/table-cell-custom';
import { Subscription } from 'rxjs/Subscription';
import {
  ApplicationStateService,
  ApplicationStateData,
} from './../../../application-state/application-state.service';
import { selectEntity } from '../../../../../store/selectors/api.selectors';
import { AppMetadataProperties } from '../../../../../store/actions/app-metadata.actions';

@Component({
  selector: 'app-card-app',
  templateUrl: './card-app.component.html',
  styleUrls: ['./card-app.component.scss']
})
export class CardAppComponent extends TableCellCustom<APIResource> implements OnInit, OnDestroy {

  @Input('row') row;
  applicationState: ApplicationStateData;
  fetchAppState$: Subscription;

  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService) {
    super();
  }
  ngOnInit() {
    this.fetchAppState$ = this.store.select(selectEntity(AppMetadataProperties.INSTANCES, this.row.entity.guid))
      // this.fetchAppState$ = this.store.select(selectMetadata('instances', this.row.entity.guid))
      .pipe(
      tap(appInstances => {
        this.applicationState = this.appStateService.get(this.row.entity, appInstances ? appInstances : null);
      })
      ).subscribe();

  }

  ngOnDestroy() {
    this.fetchAppState$.unsubscribe();
  }

}

