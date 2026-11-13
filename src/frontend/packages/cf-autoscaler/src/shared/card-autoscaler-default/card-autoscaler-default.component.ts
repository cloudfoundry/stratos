import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, OnInit, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { ApplicationService, RunningInstancesComponent } from '@stratosui/cloud-foundry';
import { AppDetailDataService } from '../../../../cloud-foundry/src/features/applications/app-detail-data.service';
import { MetadataItemComponent } from '@stratosui/core';

import { AutoscalerPolicyDataService } from '../../services/domain-data/autoscaler-policy-data.service';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';


// FWT-959 Track A wave-3 (A-effects-cleanup slice): replaced the
// EntityServiceFactory + GetAppAutoscalerPolicyAction wiring with the
// signal-native AutoscalerPolicyDataService. The template still binds via
// `appAutoscalerPolicy$ | async` so the markup stays unchanged. The tri-
// state legacy contract is preserved: emit the policy local form when
// present, emit `false` when the data service has resolved to no-policy
// (404 or post-detach), and emit `null` while loading so neither branch
// renders.
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
  private injector = inject(Injector);

  appAutoscalerPolicy$!: Observable<AppAutoscalerPolicyLocal | false | null>;
  readonly applicationInstances = computed(() => this.detail.app()?.entity?.instances ?? null);

  readonly onUpdate = input<() => void>(() => { });

  ngOnInit() {
    const cfGuid = this.appService.cfGuid;
    const appGuid = this.appService.appGuid;

    void this.policyData.load(cfGuid, appGuid);

    const policySignal = this.policyData.policy(cfGuid, appGuid);
    const noPolicySignal = this.policyData.noPolicy(cfGuid, appGuid);
    const triState = computed<AppAutoscalerPolicyLocal | false | null>(() => {
      const policy = policySignal();
      if (policy) {
        return policy;
      }
      if (noPolicySignal()) {
        return false;
      }
      return null;
    });

    this.appAutoscalerPolicy$ = toObservable(triState, { injector: this.injector }).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

}
