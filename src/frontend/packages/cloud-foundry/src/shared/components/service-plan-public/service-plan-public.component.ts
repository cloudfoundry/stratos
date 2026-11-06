import { Component, Input, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
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

  readonly planAccessibility: Signal<StratosStatus> = computed(() => {
    const plan = this.pServicePlan;
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

  private pServicePlan: StServicePlan | null = null;

  @Input()
  get servicePlan(): StServicePlan | null {
    return this.pServicePlan;
  }

  set servicePlan(servicePlan: StServicePlan | null) {
    this.pServicePlan = servicePlan;
    if (!servicePlan) {
      this._visibilitySource.set(null);
      return;
    }
    this._visibilitySource.set(
      this.serviceCatalog.planVisibility(servicePlan.cnsiGuid, servicePlan.guid),
    );
  }
}
