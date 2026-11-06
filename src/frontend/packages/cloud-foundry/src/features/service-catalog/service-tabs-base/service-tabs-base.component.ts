import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import {
  IHeaderBreadcrumb,
  IPageSideNavTab,
  LoadingPageComponent,
  PageHeaderComponent,
} from '@stratosui/core';
import { CfCurrentUserPermissions, CfUserPermissionDirective } from '@stratosui/cloud-foundry';

import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import {
  StServiceBroker,
  StServiceOffering,
} from '../../../services/endpoint-data/stratos-types';
import { CSI_CANCEL_URL } from '../../../shared/components/add-service-instance/csi-mode.service';

interface SpaceScopedQuery {
  isSpaceScoped: boolean;
  spaceGuid?: string;
  orgGuid?: string;
  [CSI_CANCEL_URL]: string;
}

/**
 * ServiceTabsBaseComponent — service-offering detail page chrome
 * (tabs + breadcrumb + Add Service Instance button) for
 * /marketplace/:endpointId/:serviceId.
 *
 * Stage 9b-2: rewritten off the ngrx-coupled ServicesService onto signal-
 * native sources. Resolves the active offering through
 * ServiceCatalogDataService.serviceOffering for the title; folds the
 * "any visible plans?" check from EndpointDataService.servicePlans()
 * filtered by offering (avoids a separate fetch — the wall already loads
 * the cnsi-wide plans list); resolves the broker once via
 * ServiceCatalogDataService.serviceBroker for the space-scoped flag that
 * pre-fills the add-instance stepper's space context.
 *
 * The "any visible plans" check intentionally counts ALL plans for the
 * offering rather than only public ones — admins/users with permission
 * can still create instances of non-public plans, and gating the button
 * on public-only would hide the affordance from those users.
 */
@Component({
  selector: 'app-service-tabs-base',
  templateUrl: './service-tabs-base.component.html',
  styleUrls: ['./service-tabs-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    LoadingPageComponent,
    CfUserPermissionDirective,
  ],
})
export class ServiceTabsBaseComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(ServiceCatalogDataService);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly injector = inject(Injector);

  readonly cfGuid: string = getIdFromRoute(this.route, 'endpointId');
  readonly serviceGuid: string = getIdFromRoute(this.route, 'serviceId');

  readonly canCreateServiceInstance: CfCurrentUserPermissions = CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE;

  readonly tabLinks: IPageSideNavTab[] = [
    { link: 'summary', label: 'Summary', icon: 'description' },
    { link: 'instances', label: 'Instances', icon: 'service_instance', iconFont: 'stratos-icons' },
    { link: 'plans', label: 'Plans', icon: 'service_plan', iconFont: 'stratos-icons' },
  ];

  readonly breadcrumbs: IHeaderBreadcrumb[] = [
    { breadcrumbs: [{ value: 'Marketplace', routerLink: '/marketplace' }] },
  ];

  readonly addServiceInstanceLink: string[] = [
    '/marketplace',
    this.cfGuid,
    this.serviceGuid,
    'create',
  ];

  private readonly _offering = signal<StServiceOffering | null>(null);
  // _brokerSource holds the currently-active broker fetch (or null when
  // no broker guid is known). The broker computed below follows both
  // _brokerSource (offering swap) and the held source's value signal
  // (HTTP response landing) — one computed, two reactive layers.
  private readonly _brokerSource = signal<SignalSource<StServiceBroker | null> | null>(null);
  private readonly _broker = computed<StServiceBroker | null>(
    () => this._brokerSource()?.value() ?? null,
  );
  private readonly _endpointService = signal<EndpointDataService | null>(null);

  readonly serviceLabel: Signal<string> = computed(() => this._offering()?.name ?? '');

  // hasVisiblePlans: counts plans for this offering from
  // EndpointDataService.servicePlans (loaded once at wall init, sticky).
  // Returns true on first frame so the button isn't briefly disabled
  // while the cnsi-wide list is loading.
  readonly hasVisiblePlans: Signal<boolean> = computed(() => {
    const svc = this._endpointService();
    if (!svc) return true;
    if (svc.isLoadingServicesDetails() && svc.servicesDetailsLastFetched() === null) {
      return true;
    }
    const offeringGuid = this.serviceGuid;
    return svc.servicePlans().some(p => p.serviceOffering?.guid === offeringGuid);
  });

  readonly toolTipText: Signal<string> = computed(() =>
    this.hasVisiblePlans()
      ? 'Create service instance'
      : 'Cannot create service instance (no public or visible plans exist for service)',
  );

  // Computed queryParams for the Add Service Instance button. Pulls
  // space context from the resolved broker (if any) so a space-scoped
  // service pre-fills the stepper's space picker. The CSI_CANCEL_URL is
  // appended so cancel/success returns the user to the offering's
  // Instances tab rather than the wall.
  readonly isServiceSpaceScoped: Signal<SpaceScopedQuery> = computed(() => {
    const broker = this._broker();
    const cancelUrl = `/marketplace/${this.cfGuid}/${this.serviceGuid}/instances`;
    if (broker?.space?.guid) {
      const result: SpaceScopedQuery = {
        isSpaceScoped: true,
        spaceGuid: broker.space.guid,
        [CSI_CANCEL_URL]: cancelUrl,
      };
      return result;
    }
    return {
      isSpaceScoped: false,
      [CSI_CANCEL_URL]: cancelUrl,
    };
  });

  ngOnInit(): void {
    if (this.cfGuid) {
      const svc = this.registry.acquire(this.cfGuid);
      this._endpointService.set(svc);
      void svc.loadServicesDetails();
    }
    if (this.cfGuid && this.serviceGuid) {
      const offeringSource = this.catalog.serviceOffering(this.cfGuid, this.serviceGuid);
      runInInjectionContext(this.injector, () => {
        effect(() => this._offering.set(offeringSource.value()));
      });
    }
    runInInjectionContext(this.injector, () => {
      // When the offering lands and carries a broker ref, swap the
      // active broker source. The _broker computed follows both this
      // and the source's emitted value.
      effect(() => {
        const brokerGuid = this._offering()?.broker?.guid;
        this._brokerSource.set(
          brokerGuid ? this.catalog.serviceBroker(this.cfGuid, brokerGuid) : null,
        );
      });
    });
  }

  ngOnDestroy(): void {
    if (this.cfGuid) {
      this.registry.release(this.cfGuid);
    }
  }
}
