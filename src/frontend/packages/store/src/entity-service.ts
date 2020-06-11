import { compose, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { GeneralEntityAppState } from './app-state';
import { entityCatalog } from './entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityActionBuilderEntityConfig } from './entity-catalog/entity-catalog.types';
import { EntityFetch, EntityFetchHandler } from './entity-request-pipeline/entity-request-pipeline.types';
import { EntityMonitor } from './monitors/entity-monitor';
import { RequestInfoState, UpdatingSection } from './reducers/api-request-reducer/types';
import { getEntityUpdateSections, getUpdateSectionById, selectEntity } from './selectors/api.selectors';
import { EntityInfo } from './types/api.types';
import { EntityRequestAction } from './types/request.types';

export function isEntityBlocked(entityRequestInfo: RequestInfoState) {
  if (!entityRequestInfo) {
    return false;
  }
  return entityRequestInfo.fetching ||
    entityRequestInfo.error ||
    entityRequestInfo.deleting.busy ||
    entityRequestInfo.deleting.deleted;
}

type ActionDispatcher<T> = (updatingKey?: string, fetchEntity?: boolean) => EntityFetch<T>;
const dispatcherFactory = <T>(
  store: Store<GeneralEntityAppState>,
  action: EntityRequestAction,
  catalogEntity: StratosBaseCatalogEntity,

): ActionDispatcher<T> =>
  (updatingKey?: string, fetchEntity?: boolean) => {
    // If we're dispatching the action in the updating world ensure the key is set
    const updatedAction = {
      ...action,
      updatingKey
    }

    // Do we have a fetch handler defined by the endpoint/entity?
    const entityFetchHandler: EntityFetchHandler<T> = catalogEntity.getEntityFetchHandler()
    const fetchHandler = entityFetchHandler ?
      entityFetchHandler(store, updatedAction) :
      (entity: T) => store.dispatch(updatedAction);

    // Fetch handler requires the entity, this may be missing or stale to update if required
    return fetchEntity ? (entity: T) => {
      // Entity may be null or stale
      store.select(selectEntity<T>(catalogEntity.entityKey, action.guid)).pipe(first()).subscribe(entity => fetchHandler(entity))
      fetchHandler(entity)
    } : fetchHandler;
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
  ) {
    this.action = this.getAction(actionOrConfig);
    const catalogEntity = entityCatalog.getEntity(this.action);

    // Setup Fetch Handler
    this.actionDispatch = dispatcherFactory<T>(store, this.action, catalogEntity);

    // Setup Emit Handler
    const entityEmitHandlerBuilder = catalogEntity.getEntityEmitHandler();
    const entityEmitHandler = entityEmitHandlerBuilder ? entityEmitHandlerBuilder(
      this.action, (action) => store.dispatch(action)
    ) : () => { };


    this.updateEntity = () => {
      this.actionDispatch(this.refreshKey, true)(null);
    };

    this.updatingSection$ = entityMonitor.updatingSection$;
    this.isDeletingEntity$ = entityMonitor.isDeletingEntity$;
    this.isFetchingEntity$ = entityMonitor.isFetchingEntity$;
    this.entityObs$ = this.getEntityObservable(
      entityMonitor,
      this.actionDispatch(),
    ).pipe(
      publishReplay(1),
      refCount(),
      tap(entityEmitHandler)
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

  private actionDispatch: ActionDispatcher<T>;

  updateEntity: () => void;

  entityObs$: Observable<EntityInfo<T>>;

  isFetchingEntity$: Observable<boolean>;

  isDeletingEntity$: Observable<boolean>;

  waitForEntity$: Observable<EntityInfo<T>>;

  updatingSection$: Observable<UpdatingSection>;
  private getEntityObservable = (
    entityMonitor: EntityMonitor<T>,
    actionDispatch: EntityFetch<T>
  ): Observable<EntityInfo> => {
    const cleanEntityInfo$ = this.getCleanEntityInfoObs(entityMonitor);

    return entityMonitor.entityRequest$.pipe(
      withLatestFrom(entityMonitor.entity$),
      tap(([entityRequestInfo, entity]) => {
        if (this.shouldCallAction(entityRequestInfo, entity)) {
          actionDispatch(entity);
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
    const isBlocked = isEntityBlocked(entityRequestInfo);
    return entity && !isBlocked;
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
        // TODO: Schema should be passed to the action builders #3846.
        schemaKey,
        entityGuid,
        endpointGuid,
        actionMetadata = {},
        entityType,
        endpointType
      } = dispatcherConfigOrAction as EntityActionBuilderEntityConfig;
      const actionBuilder = entityCatalog.getEntity(endpointType, entityType).actionOrchestrator.getActionBuilder('get');
      return actionBuilder(entityGuid, endpointGuid, actionMetadata);
    }
  }

  /**
   * @param interval - The polling interval in ms.
   * @param updateKey - The store updating key for the poll
   */
  poll(interval = 10000, updateKey = this.refreshKey) {
    return this.entityMonitor.poll(
      interval,
      () => this.actionDispatch(updateKey, true)(null),
      compose(
        getUpdateSectionById(updateKey),
        getEntityUpdateSections
      )
    );
  }
}
