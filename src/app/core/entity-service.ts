import { Action, Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { denormalize, Schema } from 'normalizr';
import { Observable } from 'rxjs/Rx';
import { APIResource, EntityInfo } from '../store/types/api.types';
import { getEntityState, selectEntity, selectEntityRequestInfo } from '../store/selectors/api.selectors';
import { EntitiesState } from '../store/types/entity.types';
import { EntityRequestState } from '../store/reducers/api-request-reducer';
import { Inject, Injectable } from '@angular/core';

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
    public action: Action
  ) {
    this.entityObs$ = this.getEntityObservable(
      entityKey,
      schema,
      id,
      action
    );

    this.isDeletingEntity$ = this.entityObs$.map(a => a.entityRequestInfo.deleting.busy).startWith(false);

    this.waitForEntity$ = this.entityObs$
      .filter((appInfo) => {
        return (
          !!appInfo.entity &&
          !appInfo.entityRequestInfo.deleting.busy &&
          !appInfo.entityRequestInfo.deleting.deleted &&
          !appInfo.entityRequestInfo.error
        );
      })
      .delay(1);

    this.isFetchingEntity$ = this.entityObs$.map(ei => ei.entityRequestInfo.fetching);
  }

  entityObs$: Observable<EntityInfo>;

  isFetchingEntity$: Observable<boolean>;

  isDeletingEntity$: Observable<boolean>;

  waitForEntity$: Observable<EntityInfo>;


  private getEntityObservable = (
    entityKey: string,
    schema: Schema,
    id: string,
    action: Action
  ): Observable<EntityInfo> => {
    // This fetching var needs to end up in the state
    return Observable.combineLatest(
      this.store.select(getEntityState),
      this.store.select(selectEntity(entityKey, id)),
      this.store.select(selectEntityRequestInfo(entityKey, id))
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
          this.store.dispatch(action);
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

}
