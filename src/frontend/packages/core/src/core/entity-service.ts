import { compose, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { ValidateEntitiesStart } from '../../../store/src/actions/request.actions';
import { GeneralEntityAppState } from '../../../store/src/app-state';
import {
  RequestInfoState,
  RequestSectionKeys,
  TRequestTypeKeys,
  UpdatingSection,
} from '../../../store/src/reducers/api-request-reducer/types';
import { getEntityUpdateSections, getUpdateSectionById } from '../../../store/src/selectors/api.selectors';
import { EntityInfo } from '../../../store/src/types/api.types';
import { ICFAction, EntityRequestAction } from '../../../store/src/types/request.types';
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { EntityActionBuilderEntityConfig } from './entity-catalogue/entity-catalogue.types';
import { entityCatalogue } from './entity-catalogue/entity-catalogue.service';
import { Optional, Inject } from '@angular/core';

export const ENTITY_INFO_HANDLER = '__ENTITY_INFO_HANDLER__';

export type EntityInfoHandler = (action: EntityRequestAction) => (entityInfo: EntityInfo) => void;

export function isEntityBlocked(entityRequestInfo: RequestInfoState) {
  if (!entityRequestInfo) {
    return false;
  }
  return entityRequestInfo.fetching ||
    entityRequestInfo.error ||
    entityRequestInfo.deleting.busy ||
    entityRequestInfo.deleting.deleted;
}

const dispatcherFactory = (store: Store<GeneralEntityAppState>, action: EntityRequestAction) => (updatingKey?: string) => {
  if (updatingKey) {
    action.updatingKey = updatingKey;
  }
  store.dispatch(action);
};

/**
 * Designed to be used in a service factory provider
 */
export class EntityService<T = any> {
  public action: EntityRequestAction;
  constructor(
    store: Store<GeneralEntityAppState>,
    public entityMonitor: EntityMonitor<T>,
    actionOrConfig: EntityRequestAction | EntityActionBuilderEntityConfig,
    @Optional() @Inject(ENTITY_INFO_HANDLER) entityInfoHandlerBuilder: EntityInfoHandler
  ) {
    this.action = this.getAction(actionOrConfig);
    const actionInfoHandler = entityInfoHandlerBuilder ? entityInfoHandlerBuilder(this.action) : () => { };
    this.actionDispatch = dispatcherFactory(store, this.action);

    this.updateEntity = () => {
      this.actionDispatch(this.refreshKey);
    };

    let validated = false;

    this.updatingSection$ = entityMonitor.updatingSection$;
    this.isDeletingEntity$ = entityMonitor.isDeletingEntity$;
    this.isFetchingEntity$ = entityMonitor.isFetchingEntity$;
    this.entityObs$ = this.getEntityObservable(
      entityMonitor,
      this.actionDispatch,
    ).pipe(
      publishReplay(1),
      refCount(),
      tap((entityInfo: EntityInfo) => {
        if (!entityInfo || entityInfo.entity) {
          if ((!validateRelations || validated || isEntityBlocked(entityInfo.entityRequestInfo))) {
            return;
          }
          validated = true;
          store.dispatch(new ValidateEntitiesStart(
            this.action as ICFAction,
            [entityInfo.entity.metadata.guid],
            false
          ));
        }
      })
    );

    this.waitForEntity$ = this.entityObs$.pipe(
      filter((ent) => {
        const { entityRequestInfo, entity } = ent;
        return this.isEntityAvailable(entity, entityRequestInfo);
      }),
      publishReplay(1),
      refCount()
    );
  }

  refreshKey = 'updating';

  private actionDispatch: (key: string) => void;

  updateEntity: () => void;

  entityObs$: Observable<EntityInfo<T>>;

  isFetchingEntity$: Observable<boolean>;

  isDeletingEntity$: Observable<boolean>;

  waitForEntity$: Observable<EntityInfo<T>>;

  updatingSection$: Observable<UpdatingSection>;
  private getEntityObservable = (
    entityMonitor: EntityMonitor<T>,
    actionDispatch: (key?: string) => void
  ): Observable<EntityInfo> => {
    const cleanEntityInfo$ = this.getCleanEntityInfoObs(entityMonitor);
    return entityMonitor.entityRequest$.pipe(
      withLatestFrom(entityMonitor.entity$),
      tap(([entityRequestInfo, entity]) => {
        if (actionDispatch && this.shouldCallAction(entityRequestInfo, entity)) {
          actionDispatch();
        }
      }),
      first(),
      switchMap(() => cleanEntityInfo$)
    );
  }

  private getCleanEntityInfoObs(entityMonitor: EntityMonitor<T>) {
    return combineLatest(
      entityMonitor.entityRequest$,
      entityMonitor.entity$
    ).pipe(
      filter(([entityRequestInfo]) => {
        return !!entityRequestInfo;
      }),
      map(([entityRequestInfo, entity]) => ({
        entityRequestInfo,
        // If the entity is deleted ensure that we don't pass through a stale state
        entity: entityRequestInfo.deleting && entityRequestInfo.deleting.deleted ? null : entity
      }))
    );
  }

  private isEntityAvailable(entity, entityRequestInfo: RequestInfoState) {
    return entity && !isEntityBlocked(entityRequestInfo);
  }

  private shouldCallAction(entityRequestInfo: RequestInfoState, entity: T) {
    return !entityRequestInfo || (!entity && !isEntityBlocked(entityRequestInfo));
  }

  private getAction(dispatcherConfigOrAction: EntityActionBuilderEntityConfig | EntityRequestAction) {
    const action = dispatcherConfigOrAction as EntityRequestAction;
    if (action.type) {
      return action;
    } else {
      const {
        // TODO: Use this schema key
        schemaKey,
        entityGuid,
        endpointGuid,
        actionMetadata = {},
        entityType,
        endpointType
      } = dispatcherConfigOrAction as EntityActionBuilderEntityConfig;
      const actionBuilder = entityCatalogue.getEntity(endpointType, entityType).actionOrchestrator.getActionBuilder('get');
      return actionBuilder(entityGuid, endpointGuid, actionMetadata);
    }
  }

  /**
   * @param interval - The polling interval in ms.
   * @param updateKey - The store updating key for the poll
   */
  poll(interval = 10000, updateKey = this.refreshKey) {
    return this.entityMonitor.poll(interval, () => this.actionDispatch(updateKey), compose(
      getUpdateSectionById(updateKey),
      getEntityUpdateSections
    ));
  }
}
