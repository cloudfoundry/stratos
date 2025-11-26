import { DatePipe } from '@angular/common';
import { Component, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  ConfirmationDialogService,
  ListComponent,
  ListConfig,
  NoContentMessageComponent,
} from '@stratosui/core';
import type { CFAppState } from '../../../../../../../cf-app-state';
import {
  CfAppRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { CfOrgSpaceDataService } from '../../../../../../../shared/data-services/cf-org-space-service.service';
import { ApplicationService } from '../../../../../application.service';

@Component({
  selector: 'app-routes-tab',
  templateUrl: './routes-tab.component.html',
  styleUrls: ['./routes-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ListComponent,
    NoContentMessageComponent
],
  providers: [
    DatePipe,
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
  private appService = inject(ApplicationService);

  paginationSubscription!: Subscription;

  ngOnInit() {
    this.appService.orgDomains$.pipe(
      first()
    ).subscribe();
  }

}
