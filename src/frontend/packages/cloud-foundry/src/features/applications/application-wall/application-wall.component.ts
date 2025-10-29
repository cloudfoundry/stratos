import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { ListComponent } from '../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { NoContentMessageComponent } from '../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CfAppConfigService } from '../../../shared/components/list/list-types/app/cf-app-config.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CfUserPermissionDirective } from '../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { goToAppWall } from '../../cf/cf.helpers';

@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    PageHeaderComponent,
    ListComponent,
    CfEndpointsMissingComponent,
    NoContentMessageComponent,
    CfUserPermissionDirective
  ],
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
  providers: [
    DatePipe,
    {
      provide: ListConfig,
      useClass: CfAppConfigService
    },
    CfOrgSpaceDataService
  ]
})
export class ApplicationWallComponent implements OnDestroy {
  public cfIds$: Observable<string[]>;

  public canCreateApplication: string;

  public haveConnectedCf$: Observable<boolean>;

  constructor(
    public cloudFoundryService: CloudFoundryService,
    private store: Store<CFAppState>,
    public cfOrgSpaceService: CfOrgSpaceDataService,
    activatedRoute: ActivatedRoute,
  ) {
    // If we have an endpoint ID, select it and redirect
    const { endpointId } = activatedRoute.snapshot.params;
    if (endpointId) {
      goToAppWall(this.store, endpointId);
      return;
    }

    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints.map(endpoint => endpoint.guid)),
    );
    this.canCreateApplication = CfCurrentUserPermissions.APPLICATION_CREATE;

    this.haveConnectedCf$ = cloudFoundryService.connectedCFEndpoints$.pipe(
      map(endpoints => !!endpoints && endpoints.length > 0)
    );
  }

  ngOnDestroy(): void {
  }
}
