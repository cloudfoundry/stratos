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
import { ActivatedRoute, Router } from '@angular/router';

import {
  CardNumberMetricComponent,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
} from '@stratosui/core';

import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServiceOffering } from '../../../services/endpoint-data/stratos-types';
import {
  ServiceBrokerCardComponent,
} from '../../../shared/components/cards/service-broker-card/service-broker-card.component';
import {
  ServiceRecentInstancesCardComponent,
} from '../../../shared/components/cards/service-recent-instances-card/service-recent-instances-card.component';
import {
  ServiceSummaryCardComponent,
} from '../../../shared/components/cards/service-summary-card/service-summary-card.component';

/**
 * ServiceSummaryComponent — service-offering Summary tab parent.
 *
 * Stage 9b-2: rewritten off the ngrx-coupled ServicesService onto signal-
 * native sources. Resolves the active offering via
 * ServiceCatalogDataService.serviceOffering (single V3 fetch) and reads
 * per-CNSI services-domain lists through EndpointDataService for instance
 * + plan counts. Threads inputs (offering, brokerGuid, cfGuid + offering
 * guid for the recent-instances card) down to child cards so each card
 * stays signal-native and stateless.
 *
 * Counts come from the loaded full lists filtered by offering — same path
 * used by the Plans + Instances tabs. Avoids a separate `?return=counts`
 * round-trip per tab now that the wall already paid for the full
 * cnsi-wide list once.
 */
@Component({
  selector: 'app-service-summary',
  templateUrl: './service-summary.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
    ServiceSummaryCardComponent,
    ServiceBrokerCardComponent,
    ServiceRecentInstancesCardComponent,
  ],
})
export class ServiceSummaryComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(ServiceCatalogDataService);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly injector = inject(Injector);

  readonly cfGuid: string = getIdFromRoute(this.route, 'endpointId');
  readonly serviceGuid: string = getIdFromRoute(this.route, 'serviceId');

  private readonly _offering = signal<StServiceOffering | null>(null);
  private readonly _endpointService = signal<EndpointDataService | null>(null);

  readonly offering: Signal<StServiceOffering | null> = this._offering.asReadonly();
  readonly brokerGuid: Signal<string> = computed(() => this._offering()?.broker?.guid ?? '');
  readonly isBrokerAvailable: Signal<boolean> = computed(() => !!this.brokerGuid());

  readonly instancesCount: Signal<number> = computed(() => {
    const svc = this._endpointService();
    if (!svc) return 0;
    const offeringGuid = this.serviceGuid;
    return svc.serviceInstances().filter(
      si => si.servicePlan?.serviceOffering?.guid === offeringGuid,
    ).length;
  });

  readonly plansCount: Signal<number> = computed(() => {
    const svc = this._endpointService();
    if (!svc) return 0;
    const offeringGuid = this.serviceGuid;
    return svc.servicePlans().filter(
      p => p.serviceOffering?.guid === offeringGuid,
    ).length;
  });

  ngOnInit(): void {
    if (this.cfGuid) {
      const svc = this.registry.acquire(this.cfGuid);
      this._endpointService.set(svc);
      // Sticky cache — re-call on a warm registry is a fast no-op.
      void svc.loadServicesDetails();
    }
    if (this.cfGuid && this.serviceGuid) {
      const source = this.catalog.serviceOffering(this.cfGuid, this.serviceGuid);
      runInInjectionContext(this.injector, () => {
        effect(() => this._offering.set(source.value()));
      });
    }
    runInInjectionContext(this.injector, () => {
      // No cross-signal effects needed today; reserved for future
      // loaded-flag wiring (e.g. trigger a refresh when CF reconnects).
      effect(() => {
        // Touch the offering signal so the effect registers a dependency
        // (will be useful once the offering also drives a separate
        // catalog fetch like documentationUrl).
        this._offering();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.cfGuid) {
      this.registry.release(this.cfGuid);
    }
  }

  serviceInstancesLink = (): void => {
    void this.router.navigate(['marketplace', this.cfGuid, this.serviceGuid, 'instances']);
  };

  servicePlansLink = (): void => {
    void this.router.navigate(['marketplace', this.cfGuid, this.serviceGuid, 'plans']);
  };
}
