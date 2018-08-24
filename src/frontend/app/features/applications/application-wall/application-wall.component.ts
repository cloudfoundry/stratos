import { animate, query, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { CardAppComponent } from '../../../shared/components/list/list-types/app/card/card-app.component';
import { CfAppConfigService } from '../../../shared/components/list/list-types/app/cf-app-config.service';
import { CfAppsDataSource } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { CfOrgSpaceDataService, initCfOrgSpaceService } from '../../../shared/data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { AppState } from '../../../store/app-state';
import { applicationSchemaKey } from '../../../store/helpers/entity-factory';

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
    private store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
  ) {
    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints.map(endpoint => endpoint.guid)),
    );
    this.canCreateApplication = CurrentUserPermissions.APPLICATION_CREATE;

    this.haveConnectedCf$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints.map(endpoint => endpoint.connectionStatus === 'connected')),
      map(connected => connected.reduce((a, v) => a || v, false))
    );

    this.initCfOrgSpaceService = initCfOrgSpaceService(this.store,
      this.cfOrgSpaceService,
      applicationSchemaKey,
      CfAppsDataSource.paginationKey).subscribe();
  }

  cardComponent = CardAppComponent;

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.unsubscribe();
  }
}
