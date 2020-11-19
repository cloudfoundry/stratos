import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, startWith } from 'rxjs/operators';

import { EntityServiceFactory } from '../../store/src/entity-service-factory.service';
import { APIResource, EntityInfo } from '../../store/src/types/api.types';
import { GetAppAutoscalerInfoAction } from './actions/autoscaler.actions';

export interface AutoscalerInfo {
  name: string;
  build: string;
  support: string;
  description: string;
}

export const fetchAutoscalerInfo = (
  endpointGuid: string,
  esf: EntityServiceFactory): Observable<EntityInfo<APIResource<AutoscalerInfo>>> => {
  const action = new GetAppAutoscalerInfoAction(endpointGuid);
  const entityService = esf.create<APIResource<AutoscalerInfo>>(endpointGuid, action);
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
