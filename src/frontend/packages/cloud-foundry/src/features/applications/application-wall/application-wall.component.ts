import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListComponent, ListConfig, NoContentMessageComponent, PageHeaderComponent } from '@stratosui/core';
import { CFAppState } from '../../../cf-app-state';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
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
  cloudFoundryService = inject(CloudFoundryService);
  private store = inject<Store<CFAppState>>(Store);
  cfOrgSpaceService = inject(CfOrgSpaceDataService);

  public cfIds$!: Observable<string[]>;

  public canCreateApplication!: string;

  public haveConnectedCf$!: Observable<boolean>;

  constructor() {
    const cloudFoundryService = this.cloudFoundryService;
    const activatedRoute = inject(ActivatedRoute);

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
