import { compose, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, tap } from 'rxjs/operators';
import { AppState } from '../../../store/src/app-state';
import { TryEntityFetchAction, TryEntityValidationAction } from '../../../store/src/effects/entity-fetcher.effect';
import {
  RequestInfoState,
  RequestSectionKeys,
  TRequestTypeKeys,
  UpdatingSection
} from '../../../store/src/reducers/api-request-reducer/types';
import { getEntityUpdateSections, getUpdateSectionById } from '../../../store/src/selectors/api.selectors';
import { EntityInfo } from '../../../store/src/types/api.types';
import { ICFAction, IRequestAction } from '../../../store/src/types/request.types';
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { doOnFirstSubscribe } from './custom-operators';
import { isEntityBlocked } from '../../../store/src/effects/entity-fetcher.effect.helpers';



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
    this.actionDispatch = (updatingKey?: string) => {
      if (updatingKey) {
        action.updatingKey = updatingKey;
      }
      this.store.dispatch(action);
    };

    this.updateEntity = () => {
      this.actionDispatch(this.refreshKey);
    };

    this.updatingSection$ = entityMonitor.updatingSection$;
    this.isDeletingEntity$ = entityMonitor.isDeletingEntity$;
    this.isFetchingEntity$ = entityMonitor.isFetchingEntity$;
    this.entityObs$ = this.getEntityObservable(
      entityMonitor,
    ).pipe(
      doOnFirstSubscribe(() => {
        this.store.dispatch(new TryEntityFetchAction(
          this.actionDispatch,
          this.entityMonitor.entityKey,
          this.entityMonitor.id
        ));
        this.store.dispatch(new TryEntityValidationAction(
          this.entityMonitor.entityKey,
          this.entityMonitor.id,
          action as ICFAction
        ));
      }),
      publishReplay(1),
      refCount(),
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
  ): Observable<EntityInfo> => {
    return this.getCleanEntityInfoObs(entityMonitor);
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
      })),
      publishReplay(1),
      refCount()
    );
  }

  private isEntityAvailable(entity, entityRequestInfo: RequestInfoState) {
    return entity && !isEntityBlocked(entityRequestInfo);
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
