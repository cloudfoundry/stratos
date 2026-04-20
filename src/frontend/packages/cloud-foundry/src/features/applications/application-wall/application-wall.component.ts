import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListComponent, ListConfig, NoContentMessageComponent, PageHeaderComponent } from '@stratosui/core';
import { EndpointModel, getFullEndpointApiUrl } from '@stratosui/store';
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

  // Emits a count of endpoints that share a URL with another connected CF,
  // or null when all connected CFs have distinct URLs. Drives the duplicate-URL
  // banner that explains why the list is auto-scoped to one CF's view.
  public duplicateEndpointCount$!: Observable<number | null>;

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

    this.duplicateEndpointCount$ = cloudFoundryService.connectedCFEndpoints$.pipe(
      map((endpoints: EndpointModel[]) => ApplicationWallComponent.countDuplicateUrlEndpoints(endpoints)),
    );
  }

  // Returns the number of endpoints that share a URL with at least one other
  // connected CF, or null when all URLs are distinct. An endpoint is in a
  // "duplicate group" if its URL appears 2+ times among connected CFs.
  static countDuplicateUrlEndpoints(endpoints: EndpointModel[]): number | null {
    if (!endpoints || endpoints.length < 2) { return null; }
    const urlCounts = new Map<string, number>();
    for (const ep of endpoints) {
      const url = getFullEndpointApiUrl(ep);
      urlCounts.set(url, (urlCounts.get(url) ?? 0) + 1);
    }
    let dupCount = 0;
    for (const count of urlCounts.values()) {
      if (count > 1) { dupCount += count; }
    }
    return dupCount > 0 ? dupCount : null;
  }

  ngOnDestroy(): void {
  }
}
