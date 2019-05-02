import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { cloneObject } from '../../../core/utils.service';
import { GetAppAutoscalerPolicyAction } from '../app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../app-autoscaler.types';
import { appAutoscalerPolicySchemaKey } from '../autoscaler.store.module';

@Injectable()
export class EditAutoscalerPolicyService {

  private initialState: AppAutoscalerPolicy = {
    instance_min_count: 1,
    instance_max_count: 10,
    scaling_rules: [],
    scaling_rules_form: [],
    schedules: {
      timezone: moment.tz.guess(),
      recurring_schedule: [],
      specific_date: []
    }
  };

  private stateSubject = new BehaviorSubject(this.initialState);


  constructor(private entityServiceFactory: EntityServiceFactory) { }

  updateFromStore(appGuid: string, cfGuid: string) {
    const appAutoscalerPolicyService = this.entityServiceFactory.create<EntityInfo<AppAutoscalerPolicy>>(
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

  setState(state: AppAutoscalerPolicy) {
    this.stateSubject.next(cloneObject(state));
  }

  getState(): Observable<AppAutoscalerPolicy> {
    return this.stateSubject.asObservable();
  }

}
