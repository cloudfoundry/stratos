import { Injectable } from '@angular/core';
import moment from 'moment-timezone';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { EntityInfo } from '../../../../store/src/types/api.types';
import { autoscalerTransformArrayToMap } from '../../core/autoscaler-helpers/autoscaler-transform-policy';
import { GetAppAutoscalerPolicyAction } from '../../store/app-autoscaler.actions';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';

@Injectable()
export class EditAutoscalerPolicyService {

  private initialState: AppAutoscalerPolicyLocal = autoscalerTransformArrayToMap({
    instance_min_count: 1,
    instance_max_count: 10,
    scaling_rules: [],
    schedules: {
      timezone: moment.tz.guess(),
      recurring_schedule: [],
      specific_date: []
    }
  });

  private stateSubject = new BehaviorSubject(this.initialState);


  constructor(private entityServiceFactory: EntityServiceFactory) { }

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
      first(),
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
