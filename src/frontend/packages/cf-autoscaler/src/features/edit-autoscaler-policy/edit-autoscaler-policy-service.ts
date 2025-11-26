import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { EntityServiceFactory, type EntityInfo, type APIResource } from '@stratosui/store';
import { autoscalerTransformArrayToMap } from '../../core/autoscaler-helpers/autoscaler-transform-policy';
import { GetAppAutoscalerPolicyAction } from '../../store/app-autoscaler.actions';
import type { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';

@Injectable()
export class EditAutoscalerPolicyService {
  private entityServiceFactory = inject(EntityServiceFactory);

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

  updateFromStore(appGuid: string, cfGuid: string) {
    const appAutoscalerPolicyService = this.entityServiceFactory.create<AppAutoscalerPolicyLocal>(
      appGuid,
      new GetAppAutoscalerPolicyAction(appGuid, cfGuid)
    );

    appAutoscalerPolicyService.entityObs$.pipe(
      // Stop if we've failed to fetch a policy or we've finished fetching a policy
      filter((entityInfo: EntityInfo<AppAutoscalerPolicyLocal>) =>
        !!entityInfo.entityRequestInfo &&
        (entityInfo.entityRequestInfo.error || (!entityInfo.entityRequestInfo.fetching && !!entityInfo.entity))),
      first(),
    ).subscribe((entityInfo: EntityInfo<AppAutoscalerPolicyLocal>) => {
      if (entityInfo.entity) {
        this.setState(entityInfo.entity);
      }
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
