import { ActivatedRoute } from '@angular/router';
import { Signal, computed, effect, inject } from '@angular/core';

import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { OrgDataRegistry } from '../../../services/endpoint-data/org-data.registry';
import { SpaceDataRegistry } from '../../../services/endpoint-data/space-data.registry';
import { StOrgDetail, StSpace } from '../../../services/endpoint-data/stratos-types';
import { CfEndpointsDataService } from '../../../services/domain-data/cf-endpoints-data.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

// Shared base for the org + space quota detail pages. Owns the route-
// param-driven cf/org/space/quota guids plus the org + space signal
// sources sourced via the per-entity registries. Concrete subclasses add
// their quota-specific signal source + a getBreadcrumbs() override.
export class QuotaDefinitionBaseComponent {
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  quotaGuid: string;

  readonly org: Signal<StOrgDetail | null>;
  readonly space: Signal<StSpace | null>;
  readonly breadcrumbs: Signal<IHeaderBreadcrumb[]>;

  constructor(
    protected endpoints: CfEndpointsDataService,
    protected activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    protected activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid || activatedRoute.snapshot.queryParams.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid || activatedRoute.snapshot.queryParams.orgGuid;
    this.spaceGuid = activeRouteCfOrgSpace.spaceGuid || activatedRoute.snapshot.queryParams.spaceGuid;
    this.quotaGuid = activatedRoute.snapshot.params.quotaId || activatedRoute.snapshot.queryParams.quotaGuid;

    const orgRegistry = inject(OrgDataRegistry);
    const spaceRegistry = inject(SpaceDataRegistry);
    const orgService = this.orgGuid ? orgRegistry.acquire(this.cfGuid, this.orgGuid) : null;
    const spaceService = this.spaceGuid ? spaceRegistry.acquire(this.cfGuid, this.spaceGuid) : null;

    this.org = orgService ? orgService.org : computed<StOrgDetail | null>(() => null);
    this.space = spaceService ? spaceService.space : computed<StSpace | null>(() => null);

    // Kick the loads so the signals populate. Both services dedupe in
    // flight, so re-acquiring during the same view is cheap.
    if (orgService) {
      orgService.load().subscribe();
    }
    if (spaceService) {
      spaceService.load().subscribe();
    }

    this.breadcrumbs = computed(() => {
      const endpoint = this.endpoints.all()[this.cfGuid];
      if (!endpoint) return [];
      return this.getBreadcrumbs(endpoint, this.org(), this.space());
    });

    // Subscriptions are bookkeeping — refcounted-release tied to view destroy.
    effect((onCleanup) => {
      onCleanup(() => {
        if (orgService) orgRegistry.release(this.cfGuid, this.orgGuid);
        if (spaceService) spaceRegistry.release(this.cfGuid, this.spaceGuid);
      });
    });
  }

  protected getBreadcrumbs(
    _endpoint: EndpointModel,
    _org: StOrgDetail | null,
    _space: StSpace | null,
  ): IHeaderBreadcrumb[] {
    return [];
  }
}
