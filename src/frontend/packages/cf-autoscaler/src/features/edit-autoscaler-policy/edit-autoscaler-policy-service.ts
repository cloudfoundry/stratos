import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../core/src/core/entity-service-factory.service';
import { entityFactory } from '../../../../store/src/helpers/entity-factory';
import { EntityInfo } from '../../../../store/src/types/api.types';
import { autoscalerTransformArrayToMap } from '../../core/autoscaler-helpers/autoscaler-transform-policy';
import { GetAppAutoscalerPolicyAction } from '../../store/app-autoscaler.actions';
import { AppAutoscalerPolicy, AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';
import { appAutoscalerPolicySchemaKey } from '../../store/autoscaler.store.module';

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
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      appGuid,
      new GetAppAutoscalerPolicyAction(appGuid, cfGuid),
      false
    );

    appAutoscalerPolicyService.entityObs$.pipe(
      // Stop if we've failed to fetch a policy or we've finished fetching a policy
      filter(({ entity, entityRequestInfo }) =>
        entityRequestInfo &&
        (entityRequestInfo.error || (!entityRequestInfo.fetching && !!entity))),
      first(),
    ).subscribe((({ entity }) => {
      if (entity && entity.entity) {
        this.stateSubject.next(entity.entity);
      }
    }));
  }

  setState(state: AppAutoscalerPolicyLocal) {
    const {...newState} = state;
    this.stateSubject.next(newState);
  }

  getState(): Observable<AppAutoscalerPolicyLocal> {
    return this.stateSubject.asObservable();
  }

}
