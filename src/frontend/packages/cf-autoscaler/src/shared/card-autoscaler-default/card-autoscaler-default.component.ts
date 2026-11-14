import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, Signal, computed, inject, input } from '@angular/core';

import { ApplicationService, RunningInstancesComponent } from '@stratosui/cloud-foundry';
import { AppDetailDataService } from '../../../../cloud-foundry/src/features/applications/app-detail-data.service';
import { MetadataItemComponent } from '@stratosui/core';

import { AutoscalerPolicyDataService } from '../../services/domain-data/autoscaler-policy-data.service';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';


// Tri-state: the policy local form when present, `false` when the data
// service has resolved to no policy (404 or post-detach), and `null`
// while loading so neither branch renders.
@Component({
  selector: 'app-card-autoscaler-default',
  templateUrl: './card-autoscaler-default.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MetadataItemComponent,
    RunningInstancesComponent
  ]
})
export class CardAutoscalerDefaultComponent implements OnInit {
  appService = inject(ApplicationService);
  private detail = inject(AppDetailDataService);
  private policyData = inject(AutoscalerPolicyDataService);

  appAutoscalerPolicy!: Signal<AppAutoscalerPolicyLocal | false | null>;
  readonly applicationInstances = computed(() => this.detail.app()?.entity?.instances ?? null);

  readonly onUpdate = input<() => void>(() => { });

  ngOnInit() {
    const cfGuid = this.appService.cfGuid;
    const appGuid = this.appService.appGuid;

    void this.policyData.load(cfGuid, appGuid);

    const policySignal = this.policyData.policy(cfGuid, appGuid);
    const noPolicySignal = this.policyData.noPolicy(cfGuid, appGuid);
    this.appAutoscalerPolicy = computed<AppAutoscalerPolicyLocal | false | null>(() => {
      const policy = policySignal();
      if (policy) {
        return policy;
      }
      if (noPolicySignal()) {
        return false;
      }
      return null;
    });
  }

}
