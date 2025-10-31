import { Observable } from 'rxjs';
import { catchError, filter, map, publishReplay, refCount, startWith } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { GetAppAutoscalerInfoAction } from '../../store/app-autoscaler.actions';
import { AutoscalerInfo } from '../../store/app-autoscaler.types';

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

/**
 * Checks if autoscaler is enabled/available for the given endpoint
 * Returns true only if autoscaler is configured and accessible
 * Returns false if autoscaler URL is missing or service is unavailable
 */
export const isAutoscalerEnabled = (endpointGuid: string, esf: EntityServiceFactory): Observable<boolean> => {
  return fetchAutoscalerInfo(endpointGuid, esf).pipe(
    map(entityInfo => {
      // Autoscaler is available only if there's no error and entity data exists
      const hasError = entityInfo?.entityRequestInfo?.error;
      const hasEntity = entityInfo?.entity?.entity;
      return !hasError && !!hasEntity;
    }),
    catchError(() => [false]), // If any error occurs, treat as unavailable
    startWith(false)
  );
};
