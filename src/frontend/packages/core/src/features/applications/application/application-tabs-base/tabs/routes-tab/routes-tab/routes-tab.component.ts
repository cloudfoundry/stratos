import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { CFEntityConfig } from '../../../../../../../../../cloud-foundry/cf-types';
import { domainEntityType } from '../../../../../../../../../cloud-foundry/src/cf-entity-factory';
import { FetchAllDomains } from '../../../../../../../../../store/src/actions/domains.actions';
import { CFAppState } from '../../../../../../../../../store/src/app-state';
import {
  getPaginationObservables,
} from '../../../../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../../../../store/src/types/api.types';
import { CurrentUserPermissionsService } from '../../../../../../../core/current-user-permissions.service';
import { ConfirmationDialogService } from '../../../../../../../shared/components/confirmation-dialog.service';
import {
  CfAppRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { ListConfig } from '../../../../../../../shared/components/list/list.component.types';
import { CfOrgSpaceDataService } from '../../../../../../../shared/data-services/cf-org-space-service.service';
import { PaginationMonitorFactory } from '../../../../../../../shared/monitors/pagination-monitor.factory';
import { ApplicationService } from '../../../../../application.service';

@Component({
  selector: 'app-routes-tab',
  templateUrl: './routes-tab.component.html',
  styleUrls: ['./routes-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<CFAppState>,
        appService: ApplicationService,
        confirmDialog: ConfirmationDialogService,
        datePipe: DatePipe,
        cups: CurrentUserPermissionsService
      ) => {
        return new CfAppRoutesListConfigService(store, appService, confirmDialog, datePipe, cups);
      },
      deps: [Store, ApplicationService, ConfirmationDialogService, DatePipe, CurrentUserPermissionsService]
    },
    CfOrgSpaceDataService
  ]
})
export class RoutesTabComponent implements OnInit {

  paginationSubscription: Subscription;
  constructor(
    private store: Store<CFAppState>,
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
          new CFEntityConfig(domainEntityType)
        )
      },
      true
    ).entities$.pipe(
      first()
    ).subscribe();
  }

}
