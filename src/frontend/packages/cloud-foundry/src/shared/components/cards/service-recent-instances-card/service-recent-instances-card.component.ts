import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';

import {
  CardContentComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardWrapperComponent,
  StatefulIconComponent,
} from '@stratosui/core';
import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../../services/endpoint-data/endpoint-data.service';
import { StServiceInstance } from '../../../../services/endpoint-data/stratos-types';
import { CompactServiceInstanceCardComponent } from '../compact-service-instance-card/compact-service-instance-card.component';

const RECENT_ITEMS_COUNT = 10;

/**
 * ServiceRecentInstancesCardComponent — Summary tab card listing the
 * 10 most-recently-updated managed instances of the current service
 * offering. Drives the "Recently updated service instances" panel.
 *
 * Stage 9b-2: rewritten to read from EndpointDataService._serviceInstances
 * (signal source) and filter by serviceOffering ref guid. UPS instances
 * have no serviceOffering ref so they fall out of the filter naturally
 * (correct: this is the OFFERING summary, UPS instances aren't tied to
 * any offering). Loading indicator follows
 * EndpointDataService.isLoadingServicesDetails so the spinner clears as
 * soon as the cnsi-wide instance list lands — no per-tab fetch loop.
 */
@Component({
  selector: 'app-service-recent-instances-card',
  templateUrl: './service-recent-instances-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    StatefulIconComponent,
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    CompactServiceInstanceCardComponent,
  ],
})
export class ServiceRecentInstancesCardComponent implements OnInit, OnDestroy {
  private readonly registry = inject(EndpointDataRegistry);
  private readonly injector = inject(Injector);

  private readonly _cfGuid = signal<string>('');
  private readonly _serviceGuid = signal<string>('');
  private readonly _endpointService = signal<EndpointDataService | null>(null);

  readonly recentInstances: Signal<StServiceInstance[] | null> = computed(() => {
    const svc = this._endpointService();
    if (!svc) return null;
    if (svc.isLoadingServicesDetails() && svc.servicesDetailsLastFetched() === null) {
      // First-load: render the spinner branch by emitting null. Once the
      // first fetch completes (lastFetched flips non-null) we always show
      // the array — even if it's empty — so the empty-state copy fires.
      return null;
    }
    const offeringGuid = this._serviceGuid();
    if (!offeringGuid) return [];
    const all = svc.serviceInstances();
    const matches = all.filter(si => si.servicePlan?.serviceOffering?.guid === offeringGuid);
    matches.sort((a, b) => {
      const aT = (a.updatedAt || a.createdAt) ?? '';
      const bT = (b.updatedAt || b.createdAt) ?? '';
      // Most recent first.
      return aT <= bT ? 1 : -1;
    });
    return matches.slice(0, RECENT_ITEMS_COUNT);
  });

  @Input()
  set cfGuid(value: string) {
    this._cfGuid.set(value ?? '');
  }

  @Input()
  set serviceGuid(value: string) {
    this._serviceGuid.set(value ?? '');
  }

  ngOnInit(): void {
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const cnsi = this._cfGuid();
        if (!cnsi) {
          this._endpointService.set(null);
          return;
        }
        const svc = this.registry.acquire(cnsi);
        this._endpointService.set(svc);
        // Loading instances on demand keeps the Summary card useful even
        // when the user navigates straight to the offering detail page
        // without first visiting the wall (cache is sticky after first
        // load — re-call is a fast no-op).
        void svc.loadServicesDetails();
      });
    });
  }

  ngOnDestroy(): void {
    const cnsi = this._cfGuid();
    if (cnsi) {
      this.registry.release(cnsi);
    }
  }
}
