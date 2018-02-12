import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';

import { ApplicationService } from '../../../../../../features/applications/application.service';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { ApplicationStateData, ApplicationStateService } from '../../../../application-state/application-state.service';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';

/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
// import { AppMetadataProperties } from '../../../../../store/actions/app-metadata.actions';

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
    private appStateService: ApplicationStateService
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
      this.row.entity.cfGuid
    )
      .do(appSate => {
        this.applicationState = appSate;
      })
      .subscribe();

  }

  ngOnDestroy() {
    this.fetchAppState$.unsubscribe();
  }

}

