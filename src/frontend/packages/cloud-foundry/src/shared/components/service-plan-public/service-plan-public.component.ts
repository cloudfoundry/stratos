import { Component, ChangeDetectionStrategy, Signal, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  getPlanAccessibilityV3,
} from '../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServicePlan, StServicePlanVisibility } from '../../../services/endpoint-data/stratos-types';

@Component({
  selector: 'app-service-plan-public',
  templateUrl: './service-plan-public.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ServicePlanPublicComponent {
  private serviceCatalog = inject(ServiceCatalogDataService);

  // Holds the active plan-visibility fetch (a fresh SignalSource per
  // input change). Visibility lookup may legitimately 4xx for plans
  // the caller can't see (e.g. admin-only) — signalize swallows the
  // error and the value stays at null, which the helper treats as the
  // admin/error case.
  private readonly _visibilitySource = signal<SignalSource<StServicePlanVisibility | null> | null>(null);

  // Parents may pass the plan after the first render.
  readonly servicePlan = input<StServicePlan | null>();

  readonly planAccessibility: Signal<StratosStatus> = computed(() => {
    const plan = this.servicePlan();
    if (!plan) return StratosStatus.ERROR;
    const visibility = this._visibilitySource()?.value() ?? null;
    return getPlanAccessibilityV3(plan.visibilityType === 'public', visibility);
  });

  readonly planAccessibilityMessage: Signal<string> = computed(() => {
    const status = this.planAccessibility();
    if (status === StratosStatus.WARNING) return 'Service Plan has limited visibility';
    if (status === StratosStatus.ERROR) return 'Service Plan has no visibility';
    return '';
  });

  constructor() {
    // Fetch the visibility of each plan passed in. An effect, not a
    // computed: the fetch creates and writes signals.
    effect(() => {
      const plan = this.servicePlan();
      untracked(() => this._visibilitySource.set(
        plan ? this.serviceCatalog.planVisibility(plan.cnsiGuid, plan.guid) : null,
      ));
    });
  }
}
