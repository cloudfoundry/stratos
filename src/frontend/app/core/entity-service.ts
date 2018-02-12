import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';
import { tag } from 'rxjs-spy/operators/tag';
import { interval } from 'rxjs/observable/interval';
import { filter, map, publishReplay, refCount, shareReplay, tap, withLatestFrom, share } from 'rxjs/operators';
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
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { combineLatest } from 'rxjs/operators/combineLatest';

type PollUntil = (apiResource: APIResource, updatingState: ActionState) => boolean;
/**
 * Designed to be used in a service factory provider
 */
@Injectable()
export class EntityService<T = any> {

  constructor(
    private store: Store<AppState>,
    public entityMonitor: EntityMonitor<T>,
    public action: IRequestAction,
    public entitySection: TRequestTypeKeys = RequestSectionKeys.CF
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

    this.updatingSection$ = entityMonitor.updatingSection$;
    this.isDeletingEntity$ = entityMonitor.isDeletingEntity$;
    this.isFetchingEntity$ = entityMonitor.isFetchingEntity$;
    this.entityObs$ = this.getEntityObservable(
      entityMonitor,
      this.actionDispatch
    );

    this.waitForEntity$ = this.entityObs$.pipe(
      filter((ent) => {
        const { entityRequestInfo, entity } = ent;
        const available = !!entity &&
          !entityRequestInfo.deleting.busy &&
          !entityRequestInfo.deleting.deleted &&
          !entityRequestInfo.error;
        return (
          available
        );
      }),
      shareReplay(1)
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
    return entityMonitor.entityRequest$
      .withLatestFrom(entityMonitor.entity$)
      .do(([entityRequestInfo, entity]) => {
        if (actionDispatch && this.shouldCallAction(entityRequestInfo, entity)) {
          actionDispatch();
        }
      })
      .filter((entityRequestInfo) => {
        return !!entityRequestInfo;
      })
      .map(([entityRequestInfo, entity]) => {
        return {
          entityRequestInfo,
          entity: entity ? entity : null
        };
      });
  }

  private shouldCallAction(entityRequestInfo: RequestInfoState, entity: T) {
    return !entityRequestInfo ||
      !entity &&
      !entityRequestInfo.fetching &&
      !entityRequestInfo.error &&
      !entityRequestInfo.deleting.busy &&
      !entityRequestInfo.deleting.deleted;

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
        this.entityMonitor.entity$,
        this.entityMonitor.entityRequest$
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
      share(),
    );
  }

}
