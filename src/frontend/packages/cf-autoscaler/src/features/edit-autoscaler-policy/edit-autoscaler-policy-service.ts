import { effect, inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { autoscalerTransformArrayToMap } from '../../core/autoscaler-helpers/autoscaler-transform-policy';
import { AutoscalerPolicyDataService } from '../../services/domain-data/autoscaler-policy-data.service';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';

@Injectable()
export class EditAutoscalerPolicyService {
  private policyData = inject(AutoscalerPolicyDataService);
  private injector = inject(Injector);

  private initialState: AppAutoscalerPolicyLocal = autoscalerTransformArrayToMap({
    instance_min_count: 1,
    instance_max_count: 10,
    scaling_rules: [],
    schedules: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recurring_schedule: [],
      specific_date: []
    }
  });

  private stateSubject = new BehaviorSubject(this.initialState);

  // FWT-959 Track A wave-3 (A-policy slice): replaced the EntityServiceFactory
  // + GetAppAutoscalerPolicyAction wiring with the signal-native
  // AutoscalerPolicyDataService. Behaviour preserved: load the policy from
  // the backend, then once it lands (success OR error) seed the local
  // BehaviorSubject from the loaded entity. The legacy `take(1)` filter that
  // gated on (error || (!fetching && entity)) becomes a one-shot effect that
  // copies the loaded policy into stateSubject the first time loading flips
  // false. Errors / no-policy leave the initial template state in place,
  // which matches the legacy behaviour (the take(1) filter only setState'd
  // when entity was present).
  updateFromStore(appGuid: string, cfGuid: string) {
    void this.policyData.load(cfGuid, appGuid);

    const loadingSig = this.policyData.loading(cfGuid, appGuid);
    const policySig = this.policyData.policy(cfGuid, appGuid);

    runInInjectionContext(this.injector, () => {
      let armed = false;
      const ref = effect(() => {
        const isLoading = loadingSig();
        const policy = policySig();
        // Wait until at least one load() cycle has flipped loading -> false.
        if (isLoading) {
          armed = true;
          return;
        }
        if (!armed) {
          return;
        }
        // First settled state after a load attempt — apply if we got a
        // policy, then stop listening.
        if (policy) {
          this.setState(policy);
        }
        ref.destroy();
      });
    });
  }

  setState(state: AppAutoscalerPolicyLocal) {
    const newState = JSON.parse(JSON.stringify(state));
    this.stateSubject.next(newState);
  }

  getState(): Observable<AppAutoscalerPolicyLocal> {
    return this.stateSubject.asObservable();
  }

}
