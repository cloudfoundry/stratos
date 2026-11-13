import { computed, effect, inject, Injectable, Injector, runInInjectionContext, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { autoscalerTransformArrayToMap } from '../../core/autoscaler-helpers/autoscaler-transform-policy';
import { AutoscalerPolicyDataService } from '../../services/domain-data/autoscaler-policy-data.service';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';
import { autoscalerDefaultTimezone } from '../../core/autoscaler-helpers/autoscaler-timezones';

@Injectable()
export class EditAutoscalerPolicyService {
  private policyData = inject(AutoscalerPolicyDataService);
  private injector = inject(Injector);

  private initialState: AppAutoscalerPolicyLocal = autoscalerTransformArrayToMap({
    instance_min_count: 1,
    instance_max_count: 10,
    scaling_rules: [],
    schedules: {
      timezone: autoscalerDefaultTimezone(),
      recurring_schedule: [],
      specific_date: []
    }
  });

  private readonly state = signal(this.initialState);
  // The editor's steps see no state until the saved policy has loaded (or
  // is known not to exist), so nothing typed is replaced when it arrives.
  private readonly settled = signal(false);
  private readonly settledState = computed(() => (this.settled() ? this.state() : undefined));
  private loadStarted = false;

  // FWT-959 Track A wave-3 (A-policy slice): replaced the EntityServiceFactory
  // + GetAppAutoscalerPolicyAction wiring with the signal-native
  // AutoscalerPolicyDataService. Behaviour preserved: load the policy from
  // the backend, then once it lands (success OR error) seed the local
  // state from the loaded entity. The legacy `take(1)` filter that
  // gated on (error || (!fetching && entity)) becomes a one-shot effect that
  // copies the loaded policy into the state the first time loading flips
  // false. Errors / no-policy leave the initial template state in place,
  // which matches the legacy behaviour (the take(1) filter only setState'd
  // when entity was present).
  updateFromStore(appGuid: string, cfGuid: string) {
    // Step 1 calls this each time it is entered; loading again would put the
    // saved policy back over edits made since.
    if (this.loadStarted) {
      return;
    }
    this.loadStarted = true;
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
        } else {
          this.settled.set(true);
        }
        ref.destroy();
      });
    });
  }

  setState(state: AppAutoscalerPolicyLocal) {
    const newState = JSON.parse(JSON.stringify(state));
    this.state.set(newState);
    this.settled.set(true);
  }

  // Emits nothing until the state has settled, then the current state and
  // each later change.
  getState(): Observable<AppAutoscalerPolicyLocal> {
    return toObservable(this.settledState, { injector: this.injector }).pipe(
      filter((state): state is AppAutoscalerPolicyLocal => state !== undefined),
    );
  }

}
