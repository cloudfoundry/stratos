import { Action, compose, Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { denormalize, Schema } from 'normalizr';
import { Observable } from 'rxjs/Rx';
import { APIAction, APIResource, EntityInfo } from '../store/types/api.types';
import {
  getEntityState,
  getEntityUpdateSections,
  getUpdateSectionById,
  selectEntity,
  selectEntityRequestInfo,
  selectEntityUpdateInfo,
} from '../store/selectors/api.selectors';
import { EntitiesState } from '../store/types/entity.types';
import { ActionState, EntityRequestState } from '../store/reducers/api-request-reducer';
import { Inject, Injectable } from '@angular/core';

type PollUntil = (apiResource: APIResource, updatingState: ActionState) => boolean;
/**
 * Designed to be used in a service factory provider
 */
@Injectable()
export class EntityService {

  constructor(
    private store: Store<AppState>,
    public entityKey: string,
    public schema: Schema,
    public id: string,
    public action: APIAction
  ) {
    this.entitySelect$ = store.select(selectEntity(entityKey, id));
    this.entityRequestSelect$ = store.select(selectEntityRequestInfo(entityKey, id));
    this.actionDispatch = (updatingKey) => {
      if (updatingKey) {
        action.updatingKey = updatingKey;
      }
      this.store.dispatch(action);
    };

    this.updateEntity = () => {
      this.actionDispatch(this.refreshKey);
    };

    this.entityObs$ = this.getEntityObservable(
      schema,
      this.actionDispatch,
      this.entitySelect$,
      this.entityRequestSelect$
    );

    this.isDeletingEntity$ = this.entityObs$.map(a => a.entityRequestInfo.deleting.busy).startWith(false);

    this.waitForEntity$ = this.entityObs$
      .filter((appInfo) => {
        const available = !!appInfo.entity &&
          !appInfo.entityRequestInfo.deleting.busy &&
          !appInfo.entityRequestInfo.deleting.deleted &&
          !appInfo.entityRequestInfo.error;
        return (
          available
        );
      })
      .delay(1);

    this.isFetchingEntity$ = this.entityObs$.map(ei => ei.entityRequestInfo.fetching);
  }

  refreshKey = 'updating';

  private entitySelect$: Observable<APIResource>;
  private entityRequestSelect$: Observable<EntityRequestState>;
  private actionDispatch: Function;

  updateEntity: Function;

  entityObs$: Observable<EntityInfo>;

  isFetchingEntity$: Observable<boolean>;

  isDeletingEntity$: Observable<boolean>;

  waitForEntity$: Observable<EntityInfo>;

  private getEntityObservable = (
    schema: Schema,
    actionDispatch: Function,
    entitySelect$: Observable<APIResource>,
    entityRequestSelect$: Observable<EntityRequestState>
  ): Observable<EntityInfo> => {
    // This fetching var needs to end up in the state
    return Observable.combineLatest(
      this.store.select(getEntityState),
      entitySelect$,
      entityRequestSelect$
    )
      .do(([entities, entity, entityRequestInfo]: [EntitiesState, APIResource, EntityRequestState]) => {
        if (
          !entityRequestInfo ||
          !entity &&
          !entityRequestInfo.fetching &&
          !entityRequestInfo.error &&
          !entityRequestInfo.deleting.busy &&
          !entityRequestInfo.deleting.deleted
        ) {
          actionDispatch();
        }
      })
      .filter(([entities, entity, entityRequestInfo]) => {
        return !!entityRequestInfo;
      })
      .map(([entities, entity, entityRequestInfo]) => {
        return {
          entityRequestInfo,
          entity: entity ? {
            entity: denormalize(entity, schema, entities).entity,
            metadata: entity.metadata
          } : null
        };
      });
  }
  /**
   * @param interval - The polling interval in ms.
   * @param key - The store updating key for the poll
   */
  poll(interval = 10000, key = this.refreshKey) {
    return Observable.interval(interval)
      .withLatestFrom(
      this.entitySelect$.startWith(null),
      this.entityRequestSelect$.startWith(null)
      )
      .map(a => ({
        resource: a[1],
        updatingSection: compose(
          getUpdateSectionById(key),
          getEntityUpdateSections,
          () => a[2]
        )({})
      }))
      .do(({ resource, updatingSection }) => {
        if (!updatingSection || !updatingSection.busy) {
          this.actionDispatch(key);
        }
      })
      .filter(({ resource, updatingSection }) => {
        return !!updatingSection;
      });
  }

}
