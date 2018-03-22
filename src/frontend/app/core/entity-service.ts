import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { tag } from 'rxjs-spy/operators/tag';
import { interval } from 'rxjs/observable/interval';
import { filter, map, publishReplay, refCount, share, shareReplay, tap, withLatestFrom } from 'rxjs/operators';
import { Observable } from 'rxjs/Rx';

import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { ValidateEntitiesStart } from '../store/actions/request.actions';
import { AppState } from '../store/app-state';
import {
  ActionState,
  RequestInfoState,
  RequestSectionKeys,
  TRequestTypeKeys,
  UpdatingSection,
} from '../store/reducers/api-request-reducer/types';
import { getEntityUpdateSections, getUpdateSectionById } from '../store/selectors/api.selectors';
import { APIResource, EntityInfo } from '../store/types/api.types';
import { ICFAction, IRequestAction } from '../store/types/request.types';
import { composeFn } from './../store/helpers/reducer.helper';

type PollUntil = (apiResource: APIResource, updatingState: ActionState) => boolean;

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
@Injectable()
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
      filter(entityInfo => !entityInfo || entityInfo.entity),
      tap((entityInfo: EntityInfo) => {
        if (!validateRelations || validated || isEntityBlocked(entityInfo.entityRequestInfo)) {
          return;
        }
        // If we're not an 'official' object, go forth and fetch again. This will populate all the required '<entity>__guid' fields.
        if (!entityInfo.entity.metadata) {
          this.actionDispatch();
          return;
        }
        validated = true;
        store.dispatch(new ValidateEntitiesStart(
          action as ICFAction,
          [entityInfo.entity.metadata.guid],
          false
        ));
      })
    );

    this.waitForEntity$ = this.entityObs$.pipe(
      filter((ent) => {
        const { entityRequestInfo, entity } = ent;
        return this.isEntityAvailable(entity, entityRequestInfo);
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
    return Observable.interval(interval)
      .pipe(
        tag('poll'),
        withLatestFrom(
          this.entityMonitor.entity$,
          this.entityMonitor.entityRequest$
        ),
        map(([poll, resource, requestState]) => ({
          resource,
          updatingSection: composeFn(
            getUpdateSectionById(updateKey),
            getEntityUpdateSections,
            () => requestState
          )
        })),
        tap(({ resource, updatingSection }) => {
          if (!updatingSection || !updatingSection.busy) {
            this.actionDispatch(updateKey);
          }
        }),
        filter(({ resource, updatingSection }) => {
          return !!updatingSection;
        }),
        share(),
    );
  }

}
