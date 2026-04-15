import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, filter,  } from 'rxjs/operators';
import { EntityServiceFactory, EntityInfo } from '@stratosui/store';
import { autoscalerTransformArrayToMap } from '../../core/autoscaler-helpers/autoscaler-transform-policy';
import { GetAppAutoscalerPolicyAction } from '../../store/app-autoscaler.actions';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';

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
    const appAutoscalerPolicyService = this.entityServiceFactory.create<EntityInfo<AppAutoscalerPolicyLocal>>(
      appGuid,
      new GetAppAutoscalerPolicyAction(appGuid, cfGuid)
    );

    appAutoscalerPolicyService.entityObs$.pipe(
      // Stop if we've failed to fetch a policy or we've finished fetching a policy
      filter(({ entity, entityRequestInfo }) =>
        entityRequestInfo &&
        (entityRequestInfo.error || (!entityRequestInfo.fetching && !!entity))),
      take(1),
    ).subscribe((({ entity }) => {
      if (entity && entity.entity) {
        this.setState(entity.entity);
      }
    }));
  }

  setState(state: AppAutoscalerPolicyLocal) {
    const newState = JSON.parse(JSON.stringify(state));
    this.stateSubject.next(newState);
  }

  getState(): Observable<AppAutoscalerPolicyLocal> {
    return this.stateSubject.asObservable();
  }

}
