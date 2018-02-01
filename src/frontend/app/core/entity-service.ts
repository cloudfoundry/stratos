import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';
import { tag } from 'rxjs-spy/operators/tag';
import { interval } from 'rxjs/observable/interval';
import { debounceTime, filter, map, share, shareReplay, tap, withLatestFrom } from 'rxjs/operators';
import { Observable } from 'rxjs/Rx';

import { AppState } from '../store/app-state';
import {
  ActionState,
  RequestInfoState,
  RequestSectionKeys,
  TRequestTypeKeys,
  UpdatingSection,
} from '../store/reducers/api-request-reducer/types';
import {
  getAPIRequestDataState,
  getEntityUpdateSections,
  getUpdateSectionById,
  selectEntity,
  selectRequestInfo,
} from '../store/selectors/api.selectors';
import { APIResource, EntityInfo } from '../store/types/api.types';
import { IRequestAction } from '../store/types/request.types';
import { composeFn } from './../store/helpers/reducer.helper';

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
    public action: IRequestAction,
    public entitySection: TRequestTypeKeys = RequestSectionKeys.CF
  ) {
    this.entitySelect$ = store.select(selectEntity(entityKey, id)).pipe(
      shareReplay(1),
      // tag('entity-obs')
    );
    this.entityRequestSelect$ = store.select(selectRequestInfo(entityKey, id)).pipe(
      shareReplay(1),
      tag('entity-request-obs')
    );
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

    this.updatingSection$ = this.entityRequestSelect$.map(request => request.updating).distinctUntilChanged().shareReplay(1);
    this.isDeletingEntity$ = this.entityRequestSelect$.map(request => request.deleting.busy).distinctUntilChanged().shareReplay(1);
    this.isFetchingEntity$ = this.entityRequestSelect$.map(request => request.fetching).distinctUntilChanged().shareReplay(1);

    this.waitForEntity$ = this.entityObs$
      .filter((entityInfo) => {
        const available = !!entityInfo.entity &&
          !entityInfo.entityRequestInfo.deleting.busy &&
          !entityInfo.entityRequestInfo.deleting.deleted &&
          !entityInfo.entityRequestInfo.error;
        return (
          available
        );
      })
      .delay(1)
      .shareReplay(1);


  }

  refreshKey = 'updating';

  private entitySelect$: Observable<APIResource>;
  private entityRequestSelect$: Observable<RequestInfoState>;
  private actionDispatch: Function;

  updateEntity: Function;

  entityObs$: Observable<EntityInfo>;

  isFetchingEntity$: Observable<boolean>;

  isDeletingEntity$: Observable<boolean>;

  waitForEntity$: Observable<EntityInfo>;

  updatingSection$: Observable<UpdatingSection>;

  private getEntityObservable = (
    schema: Schema,
    actionDispatch: Function,
    entitySelect$: Observable<APIResource>,
    entityRequestSelect$: Observable<RequestInfoState>
  ): Observable<EntityInfo> => {
    const apiRequestData$ = this.store.select(getAPIRequestDataState).shareReplay(1);
    return Observable.combineLatest(
      apiRequestData$,
      entitySelect$,
      entityRequestSelect$
    )
      .shareReplay(1)
      .do(([entities, entity, entityRequestInfo]) => {
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
      .pipe(
      tag('poll'),
      withLatestFrom(
        this.entitySelect$,
        this.entityRequestSelect$
      ),
      map(a => ({
        resource: a[1],
        updatingSection: composeFn(
          getUpdateSectionById(key),
          getEntityUpdateSections,
          () => a[2]
        )
      })),
      tap(({ resource, updatingSection }) => {
        if (!updatingSection || !updatingSection.busy) {
          this.actionDispatch(key);
        }
      }),
      filter(({ resource, updatingSection }) => {
        return !!updatingSection;
      }),
      shareReplay(1)
      );
  }

}
