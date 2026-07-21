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
  TailwindDialogService,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
} from '@stratosui/core';
import { EndpointModel } from '@stratosui/store';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { StOrgDetail, StSpace, StSpaceQuota } from '../../../services/endpoint-data/stratos-types';
import {
  ApplyQuotaToSpacesDialogComponent,
  ApplyQuotaToSpacesDialogData,
} from './apply-quota-to-spaces-dialog/apply-quota-to-spaces-dialog.component';
import { CfEndpointsDataService } from '../../../services/domain-data/cf-endpoints-data.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QuotaDefinitionBaseComponent } from '../quota-definition-base/quota-definition-base.component';

export const QUOTA_SPACE_GUID = 'space';

@Component({
  selector: 'app-space-quota-definition',
  templateUrl: './space-quota-definition.component.html',
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
    LoadingPageComponent,
    BooleanIndicatorComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
  ]
})
export class SpaceQuotaDefinitionComponent extends QuotaDefinitionBaseComponent {
  readonly spaceQuotaDefinition: Signal<StSpaceQuota | null>;
  readonly detailsLoading: Signal<boolean>;
  // Observable bridge for <app-loading-page>.
  readonly detailsLoading$: Observable<boolean>;
  readonly editLink: Signal<string[]>;
  readonly canEditQuota: Signal<boolean>;
  // The quota guid this page resolved to (route param, or the assigned quota of
  // the space in view). Captured as a field so openApplyToSpaces() can read it.
  readonly resolvedQuotaGuid: Signal<string | null>;

  private readonly dialog = inject(TailwindDialogService);

  editParams!: object;
  public isOrg = false;

  constructor() {
    const endpoints = inject(CfEndpointsDataService);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const activatedRoute = inject(ActivatedRoute);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const quotaData = inject(QuotaDataService);

    super(endpoints, activeRouteCfOrgSpace, activatedRoute);

    const { cfGuid, orgGuid, spaceGuid } = activeRouteCfOrgSpace;
    this.canEditQuota = toSignal(
      currentUserPermissionsService.can(CfCurrentUserPermissions.SPACE_QUOTA_EDIT, cfGuid, orgGuid),
      { initialValue: false },
    );
    this.isOrg = !spaceGuid;
    this.editParams = { [QUOTA_SPACE_GUID]: spaceGuid };

    const resolvedQuotaGuid: Signal<string | null> = computed(() => {
      if (this.quotaGuid) return this.quotaGuid;
      return this.space()?.quotaGuid ?? null;
    });
    this.resolvedQuotaGuid = resolvedQuotaGuid;

    const sourceSignal = computed(() => {
      const guid = resolvedQuotaGuid();
      return guid ? quotaData.spaceQuota(this.cfGuid, guid) : null;
    });
    this.spaceQuotaDefinition = computed(() => sourceSignal()?.value() ?? null);
    this.detailsLoading = computed(() => sourceSignal()?.isLoading() ?? false);
    this.detailsLoading$ = toObservable(this.detailsLoading);

    this.editLink = computed(() => {
      const guid = resolvedQuotaGuid();
      return guid ? [
        '/cloud-foundry',
        this.cfGuid,
        'organizations',
        this.orgGuid,
        'space-quota-definitions',
        guid,
        'edit-space-quota'
      ] : [];
    });
  }

  // Opens the multi-select "apply to spaces" dialog. The quota + its org are
  // fixed by the page in view; the dialog only chooses which spaces receive it,
  // then calls QuotaDataService.applySpaceQuotaToSpaces for the whole set.
  openApplyToSpaces(): void {
    const quotaGuid = this.resolvedQuotaGuid();
    if (!quotaGuid) return;
    this.dialog.open<ApplyQuotaToSpacesDialogComponent, ApplyQuotaToSpacesDialogData, boolean>(
      ApplyQuotaToSpacesDialogComponent,
      {
        ariaLabelledBy: 'apply-quota-to-spaces-title',
        data: {
          cfGuid: this.cfGuid,
          orgGuid: this.orgGuid,
          quotaGuid,
          quotaName: this.spaceQuotaDefinition()?.name,
        },
      },
    );
  }

  protected override getBreadcrumbs(
    endpoint: EndpointModel,
    org: StOrgDetail | null,
    space: StSpace | null,
  ): IHeaderBreadcrumb[] {
    if (!org) return [];
    const baseCFUrl = `/cloud-foundry/${this.cfGuid}`;
    const baseOrgUrl = `${baseCFUrl}/organizations/${org.guid}`;

    const breadcrumbs: IHeaderBreadcrumb[] = [
      {
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.name, routerLink: `${baseOrgUrl}/space-quota-definitions` },
        ] },
    ];

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

    return breadcrumbs;
  }
}
