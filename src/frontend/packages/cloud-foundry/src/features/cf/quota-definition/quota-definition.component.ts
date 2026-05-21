import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import {
  BooleanIndicatorComponent,
  CardNumberMetricComponent,
  CurrentUserPermissionsService,
  CustomTooltipDirective,
  IHeaderBreadcrumb,
  LoadingPageComponent,
  PageHeaderComponent,
  PageSubNavComponent,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
} from '@stratosui/core';
import { EndpointModel } from '@stratosui/store';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { StOrgDetail, StOrgQuota, StSpace } from '../../../services/endpoint-data/stratos-types';
import { CfEndpointsDataService } from '../../../services/domain-data/cf-endpoints-data.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QuotaDefinitionBaseComponent } from '../quota-definition-base/quota-definition-base.component';

export const QUOTA_ORG_GUID = 'org';

@Component({
  selector: 'app-quota-definition',
  templateUrl: './quota-definition.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CustomTooltipDirective,
    PageHeaderComponent,
    PageSubNavComponent,
    BooleanIndicatorComponent,
    LoadingPageComponent,
    CardNumberMetricComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent
  ]
})
export class QuotaDefinitionComponent extends QuotaDefinitionBaseComponent {
  readonly quotaDefinition: Signal<StOrgQuota | null>;
  readonly detailsLoading: Signal<boolean>;
  // Observable bridge for <app-loading-page> until it migrates to Signal inputs.
  readonly detailsLoading$: Observable<boolean>;
  readonly editLink: Signal<string[]>;
  readonly canEditQuota: Signal<boolean>;

  editParams: object;
  public isCf = false;

  constructor() {
    const endpoints = inject(CfEndpointsDataService);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const activatedRoute = inject(ActivatedRoute);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const quotaData = inject(QuotaDataService);

    super(endpoints, activeRouteCfOrgSpace, activatedRoute);

    const { cfGuid, orgGuid } = activeRouteCfOrgSpace;
    this.canEditQuota = toSignal(
      currentUserPermissionsService.can(CfCurrentUserPermissions.QUOTA_EDIT, cfGuid),
      { initialValue: false },
    );
    this.isCf = !orgGuid;
    this.editParams = { [QUOTA_ORG_GUID]: orgGuid };

    // Quota guid comes from the route directly, or — for org detail pages
    // where the URL doesn't include the quota — falls back to the org's
    // linked quotaGuid once the org load completes.
    const resolvedQuotaGuid: Signal<string | null> = computed(() => {
      if (this.quotaGuid) return this.quotaGuid;
      return this.org()?.quotaGuid ?? null;
    });

    const sourceSignal = computed(() => {
      const guid = resolvedQuotaGuid();
      return guid ? quotaData.orgQuota(this.cfGuid, guid) : null;
    });
    this.quotaDefinition = computed(() => sourceSignal()?.value() ?? null);
    this.detailsLoading = computed(() => sourceSignal()?.isLoading() ?? false);
    this.detailsLoading$ = toObservable(this.detailsLoading);

    this.editLink = computed(() => {
      const guid = resolvedQuotaGuid();
      return guid ? [
        '/cloud-foundry',
        this.cfGuid,
        'quota-definitions',
        guid,
        'edit-quota'
      ] : [];
    });
  }

  protected override getBreadcrumbs(
    endpoint: EndpointModel,
    org: StOrgDetail | null,
    space: StSpace | null,
  ): IHeaderBreadcrumb[] {
    const baseCFUrl = `/cloud-foundry/${this.cfGuid}`;

    const breadcrumbs: IHeaderBreadcrumb[] = [{
      breadcrumbs: [
        { value: endpoint.name, routerLink: `${baseCFUrl}/quota-definitions` },
      ]
    }];

    if (org) {
      const baseOrgUrl = `${baseCFUrl}/organizations/${org.guid}`;
      breadcrumbs.push({
        key: 'org',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.name, routerLink: `${baseOrgUrl}/summary` },
        ]
      });

      if (space) {
        const baseSpaceUrl = `${baseCFUrl}/organizations/${org.guid}/spaces/${space.guid}`;
        breadcrumbs.push({
          key: 'space',
          breadcrumbs: [
            { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
            { value: org.name, routerLink: `${baseOrgUrl}/spaces` },
            { value: space.name, routerLink: `${baseSpaceUrl}/summary` },
          ]
        });
      }
    }

    return breadcrumbs;
  }
}
