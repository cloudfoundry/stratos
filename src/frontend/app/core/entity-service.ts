import { compose, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { ValidateEntitiesStart } from '../store/actions/request.actions';
import { AppState } from '../store/app-state';
import {
  RequestInfoState,
  RequestSectionKeys,
  TRequestTypeKeys,
  UpdatingSection,
} from '../store/reducers/api-request-reducer/types';
import { getEntityUpdateSections, getUpdateSectionById } from '../store/selectors/api.selectors';
import { EntityInfo } from '../store/types/api.types';
import { ICFAction, IRequestAction } from '../store/types/request.types';

export function isEntityBlocked(entityRequestInfo: RequestInfoState) {
  if (!entityRequestInfo) {
    return false;
  }
  return entityRequestInfo.fetching ||
    entityRequestInfo.error ||
    entityRequestInfo.deleting.busy ||
    entityRequestInfo.deleting.deleted ||
    entityRequestInfo.updating._root_.busy;
}

/**
 * Designed to be used in a service factory provider
 */
export class EntityService<T = any> {

  constructor(
    private store: Store<AppState>,
    public entityMonitor: EntityMonitor<T>,
    public action: IRequestAction,
    public validateRelations = true,
    public entitySection: TRequestTypeKeys = RequestSectionKeys.CF,
  ) {
    this.actionDispatch = (updatingKey) => {
      if (updatingKey) {
        action.updatingKey = updatingKey;
      }
      this.store.dispatch(action);
    };

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
            action as ICFAction,
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

  private actionDispatch: Function;

  updateEntity: Function;

  entityObs$: Observable<EntityInfo<T>>;

  isFetchingEntity$: Observable<boolean>;

  isDeletingEntity$: Observable<boolean>;

  waitForEntity$: Observable<EntityInfo<T>>;

  updatingSection$: Observable<UpdatingSection>;
  private getEntityObservable = (
    entityMonitor: EntityMonitor<T>,
    actionDispatch: Function
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
        entity
      }))
    );
  }

  private isEntityAvailable(entity, entityRequestInfo: RequestInfoState) {
    return entity && !isEntityBlocked(entityRequestInfo);
  }

  private shouldCallAction(entityRequestInfo: RequestInfoState, entity: T) {
    return !entityRequestInfo || (!entity && !isEntityBlocked(entityRequestInfo));
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
