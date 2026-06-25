import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  AppChip,
  IHeaderBreadcrumb,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  AppChipsComponent,
  PageHeaderComponent,
} from '@stratosui/core';
import { of } from 'rxjs';

import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServiceInstance } from '../../../services/endpoint-data/stratos-types';

interface InstanceView {
  name: string;
  isManaged: boolean;
  typeLabel: string;
  status: string;
  statusDetail: string;
  plan: string;
  offering: string;
  broker: string;
  dashboardUrl: string;
  routeServiceUrl: string;
  syslogDrainUrl: string;
  space: string;
  org: string;
  tags: AppChip<string>[];
  createdAt: string;
  updatedAt: string;
}

/**
 * ServiceInstanceSummaryComponent — per-instance read view (#5370).
 *
 * The single read surface for one service instance, managed or
 * user-provided, at `/services/:type/:cnsi/:siGuid` (the parent of the
 * existing `.../edit` write stepper). Branches its metadata on instance
 * type: managed shows plan/offering/broker/dashboard, UPS shows the route-
 * service and syslog-drain URLs.
 *
 * Phase 1+2 (this commit): route shell + metadata card. Still to come:
 * bindings list + unbind (Phase 3), action bar (Phase 4), uniform card
 * linking (Phase 5), read-only parameters (Phase 6, needs a backend fetch).
 * UPS credentials metadata is an open question and is deliberately omitted
 * for now.
 */
@Component({
  selector: 'app-service-instance-summary',
  templateUrl: './service-instance-summary.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    AppChipsComponent,
  ],
})
export class ServiceInstanceSummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly serviceCatalog = inject(ServiceCatalogDataService);

  private readonly source: SignalSource<StServiceInstance | null>;

  readonly breadcrumbs: IHeaderBreadcrumb[] = [
    { breadcrumbs: [{ value: 'Services', routerLink: '/services' }] },
  ];

  readonly loading: Signal<boolean>;
  readonly error: Signal<boolean>;
  readonly view: Signal<InstanceView | null>;
  readonly title: Signal<string>;

  constructor() {
    const cfGuid = this.route.snapshot.params.endpointId;
    const siGuid = this.route.snapshot.params.serviceInstanceId;
    this.source = this.serviceCatalog.serviceInstance(cfGuid, siGuid);

    this.loading = this.source.isLoading;
    this.error = computed(() => this.source.error() != null);
    this.view = computed(() => {
      const si = this.source.value();
      return si ? this.toView(si) : null;
    });
    this.title = computed(() => this.view()?.name ?? '');
  }

  private toView(si: StServiceInstance): InstanceView {
    const isManaged = si.type !== 'user-provided';
    return {
      name: si.name,
      isManaged,
      typeLabel: isManaged ? 'Managed' : 'User-provided',
      status: si.lastOperation?.state ?? '',
      statusDetail: si.lastOperation?.description ?? '',
      plan: si.servicePlan?.name ?? '',
      offering: si.servicePlan?.serviceOffering?.name ?? '',
      broker: si.servicePlan?.serviceOffering?.broker?.name ?? '',
      dashboardUrl: si.dashboardUrl ?? '',
      routeServiceUrl: si.routeServiceUrl ?? '',
      syslogDrainUrl: si.syslogDrainUrl ?? '',
      space: si.space?.name ?? '',
      org: si.space?.organization?.name ?? '',
      tags: (si.tags ?? []).map(t => ({ value: t, hideClearButton$: of(true) })),
      createdAt: si.createdAt ?? '',
      updatedAt: si.updatedAt ?? '',
    };
  }
}
