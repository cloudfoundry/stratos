import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, startWith } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../core/src/core/entity-service-factory.service';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { GetAppAutoscalerInfoAction } from '../../store/app-autoscaler.actions';
import { AutoscalerInfo } from '../../store/app-autoscaler.types';

export const fetchAutoscalerInfo = (
  endpointGuid: string,
  esf: EntityServiceFactory): Observable<EntityInfo<APIResource<AutoscalerInfo>>> => {
  const action = new GetAppAutoscalerInfoAction(endpointGuid);
  const entityService = esf.create<APIResource<AutoscalerInfo>>(action.entityKey, action.entity, endpointGuid, action);
  return entityService.entityObs$.pipe(
    filter(entityInfo =>
      !!entityInfo &&
      !!entityInfo.entityRequestInfo &&
      !entityInfo.entityRequestInfo.fetching
    ),
    publishReplay(1),
    refCount()
  );
};

export const isAutoscalerEnabled = (endpointGuid: string, esf: EntityServiceFactory): Observable<boolean> => {
  return fetchAutoscalerInfo(endpointGuid, esf).pipe(
    map(entityInfo => !entityInfo.entityRequestInfo.error),
    startWith(false)
  );
};
