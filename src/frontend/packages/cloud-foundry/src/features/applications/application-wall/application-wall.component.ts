import { animate, query, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { applicationEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { CfAppConfigService } from '../../../shared/components/list/list-types/app/cf-app-config.service';
import { CfAppsDataSource } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CfOrgSpaceDataService, initCfOrgSpaceService } from '../../../shared/data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';

@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss'],
  animations: [
    trigger(
      'cardEnter', [
        transition('* => *', [
          query(':enter', [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ], { optional: true })
        ])
      ]
    )
  ],
  providers: [{
    provide: ListConfig,
    useClass: CfAppConfigService
  },
    CfOrgSpaceDataService
  ]
})
export class ApplicationWallComponent implements OnDestroy {
  public cfIds$: Observable<string[]>;
  private initCfOrgSpaceService: Subscription;

  public canCreateApplication: string;

  public haveConnectedCf$: Observable<boolean>;

  constructor(
    public cloudFoundryService: CloudFoundryService,
    private store: Store<CFAppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
  ) {
    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints.map(endpoint => endpoint.guid)),
    );
    this.canCreateApplication = CfCurrentUserPermissions.APPLICATION_CREATE;

    this.haveConnectedCf$ = cloudFoundryService.connectedCFEndpoints$.pipe(
      map(endpoints => !!endpoints && endpoints.length > 0)
    );

    this.initCfOrgSpaceService = initCfOrgSpaceService(this.store,
      this.cfOrgSpaceService,
      applicationEntityType,
      CfAppsDataSource.paginationKey).subscribe();
  }

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.unsubscribe();
  }
}
