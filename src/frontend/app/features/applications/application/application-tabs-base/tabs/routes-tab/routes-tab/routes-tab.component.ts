import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { ConfirmationDialogService } from '../../../../../../../shared/components/confirmation-dialog.service';
import {
  CfAppRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { ListConfig } from '../../../../../../../shared/components/list/list.component.types';
import { PaginationMonitorFactory } from '../../../../../../../shared/monitors/pagination-monitor.factory';
import { FetchAllDomains } from '../../../../../../../store/actions/domains.actions';
import { AppState } from '../../../../../../../store/app-state';
import { domainSchemaKey, entityFactory } from '../../../../../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../../../../../store/types/api.types';
import { ApplicationService } from '../../../../../application.service';

@Component({
  selector: 'app-routes-tab',
  templateUrl: './routes-tab.component.html',
  styleUrls: ['./routes-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<AppState>,
        appService: ApplicationService,
        confirmDialog: ConfirmationDialogService) => {
        return new CfAppRoutesListConfigService(store, appService, confirmDialog);
      },
      deps: [Store, ApplicationService, ConfirmationDialogService]
    }
  ]
})
export class RoutesTabComponent implements OnInit {

  paginationSubscription: Subscription;
  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
  }
  ngOnInit() {
    const { cfGuid } = this.appService;
    const action = new FetchAllDomains(cfGuid);
    getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(domainSchemaKey)
        )
      },
      true
    ).entities$.pipe(
      first()
    ).subscribe();
  }

}
