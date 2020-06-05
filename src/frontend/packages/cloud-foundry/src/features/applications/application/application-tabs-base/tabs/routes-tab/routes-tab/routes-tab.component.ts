import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../../../core/src/core/permissions/current-user-permissions.service';
import {
  ConfirmationDialogService,
} from '../../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfAppRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { CfOrgSpaceDataService } from '../../../../../../../shared/data-services/cf-org-space-service.service';
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
  constructor(private appService: ApplicationService) { }

  ngOnInit() {
    this.appService.orgDomains$.pipe(
      first()
    ).subscribe();
  }

}
