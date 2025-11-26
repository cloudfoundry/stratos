import { type Action, compose, type Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import type { GeneralEntityAppState } from './app-state';
import type { IEntityCatalog } from './entity-catalog/entity-catalog.interface';
import type { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { EntityActionBuilderEntityConfig } from './entity-catalog/entity-catalog.types';
import type { EntityFetch, EntityFetchHandler } from './entity-request-pipeline/entity-request-pipeline.types';
import type { EntityMonitor } from './monitors/entity-monitor';
import type { RequestInfoState, UpdatingSection } from './reducers/api-request-reducer/types';
import { getEntityUpdateSections, getUpdateSectionById, selectEntity } from './selectors/api.selectors';
import type { EntityInfo } from './types/api.types';
import type { EntityRequestAction } from './types/request.types';

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
    };

    // Do we have a fetch handler defined by the endpoint/entity?
    // Defensive: getEntityFetchHandler may not exist on all catalog entities
    const entityFetchHandler: EntityFetchHandler<T> = catalogEntity.getEntityFetchHandler?.();
    const fetchHandler = entityFetchHandler ?
      entityFetchHandler(store, updatedAction) :
      (_entity: T) => store.dispatch(updatedAction);

    // Fetch handler requires the entity, this may be missing or stale to update if required
    return fetchEntity ? (entity: T) => {
      // Entity may be null or stale
      // Defensive: Ensure entityKey exists before using it
      if (catalogEntity.entityKey) {
        store.select(selectEntity<T>(catalogEntity.entityKey, action.guid)).pipe(first()).subscribe(storeEntity => fetchHandler(storeEntity));
      }
      fetchHandler(entity);
    } : fetchHandler;
  };


/**
 * Designed to be used in a service factory provider
 */
export class EntityService<T = unknown> {
  public action: EntityRequestAction;
  constructor(
    store: Store<GeneralEntityAppState>,
    public entityMonitor: EntityMonitor<T>,
    actionOrConfig: EntityRequestAction | EntityActionBuilderEntityConfig,
    private entityCatalog: IEntityCatalog,
  ) {
    this.action = this.getAction(actionOrConfig);

    // Defensive: Entity catalog lookup may return null if endpoint/entity type not registered yet
    const catalogEntity = this.entityCatalog.getEntity(this.action) as StratosBaseCatalogEntity | null;
    if (!catalogEntity) {
      throw new Error(
        `Entity service initialization failed - catalog entity not found for ` +
        `endpoint=${this.action.endpointType}, entity=${this.action.entityType}. ` +
        `Ensure entity catalog is properly initialized before creating entity services.`
      );
    }

    // Setup Fetch Handler
    this.actionDispatch = dispatcherFactory<T>(store, this.action, catalogEntity);

    // Setup Emit Handler
    // Defensive: getEntityEmitHandler may not exist on all catalog entities
    const entityEmitHandlerBuilder = catalogEntity.getEntityEmitHandler?.();
    const entityEmitHandler = entityEmitHandlerBuilder ? entityEmitHandlerBuilder(
      this.action, (action: Action) => store.dispatch(action)
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
    ) as Observable<EntityInfo<T>>;

    this.waitForEntity$ = this.entityObs$.pipe(
      filter((ent) => {
        const { entityRequestInfo, entity } = ent;
        // Note - isEntityAvailable does not block on updating, decision taken to ensure we show entity as soon as possible.
        // This means, in the cf world, entities will be emitted here that are still in the validation process and as such may be missing
        // required relations
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
  ): Observable<EntityInfo<T>> => {
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
  };

  private getCleanEntityInfoObs(entityMonitor: EntityMonitor<T>): Observable<EntityInfo<T>> {
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
        entity: entityRequestInfo.deleting?.deleted ? null : entity
      }))
    );
  }

  private isEntityAvailable(entity: T, entityRequestInfo: RequestInfoState) {
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

      // Defensive: Entity catalog lookup may return null if endpoint/entity type not registered yet
      const catalogEntity = this.entityCatalog.getEntity(endpointType, entityType) as StratosBaseCatalogEntity | null;
      if (!catalogEntity) {
        throw new Error(
          `Cannot get action - catalog entity not found for ` +
          `endpoint=${endpointType}, entity=${entityType}. ` +
          `Ensure entity catalog is properly initialized.`
        );
      }

      // Defensive: Verify actionOrchestrator exists
      if (!catalogEntity.actionOrchestrator) {
        throw new Error(
          `Cannot get action - catalog entity for ${entityType} has no actionOrchestrator. ` +
          `This indicates an incomplete entity registration.`
        );
      }

      const actionBuilder = catalogEntity.actionOrchestrator.getActionBuilder('get');
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
