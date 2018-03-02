import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { tag } from 'rxjs-spy/operators/tag';
import { interval } from 'rxjs/observable/interval';
import { filter, first, map, share, shareReplay, tap, withLatestFrom, startWith, pairwise, distinctUntilChanged } from 'rxjs/operators';
import { Observable } from 'rxjs/Rx';

import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { AppState } from '../store/app-state';
import { validateEntityRelations } from '../store/helpers/entity-relations.helpers';
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
import { ValidateEntitiesStart } from '../store/actions/request.actions';

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
    public validateRelations = false,
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

    this.updatingSection$ = entityMonitor.updatingSection$;
    this.isDeletingEntity$ = entityMonitor.isDeletingEntity$;
    this.isFetchingEntity$ = entityMonitor.isFetchingEntity$;
    this.entityObs$ = this.getEntityObservable(
      entityMonitor,
      this.actionDispatch,
    ).pipe(
      shareReplay(1),
      startWith({
        entity: null,
        entityRequestInfo: null
      }),
      pairwise(),
      tap(([prevResult, result]) => {
        if (!validateRelations) {
          return;
        }
        const firstTime = !prevResult.entity && !!result.entity;
        // const changed = firstTime
        //   || (this.isEntityChanging(oldEntity.entityRequestInfo) && !this.isEntityChanging(newEntity.entityRequestInfo));
        if (firstTime && !this.isEntityChanging(result.entityRequestInfo)) {
          store.dispatch(new ValidateEntitiesStart(
            action as ICFAction, // TODO: RC needs options and actions.. but in theory just anything with entity
            [result.entity.metadata.guid], // TODO: RC
            false
          ));
        }
      }),
      filter(([oldEntity, newEntity]) => !!newEntity),
      map(([oldEntity, newEntity]) => newEntity)
      );

    this.waitForEntity$ = this.entityObs$.pipe(
      filter((ent) => {
        const { entityRequestInfo, entity } = ent;
        return !this.isEntityChanging(entityRequestInfo);
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

  private isEntityChanging(entityRequestInfo: RequestInfoState) {
    if (!entityRequestInfo) {
      return false;
    }
    return entityRequestInfo.fetching ||
      entityRequestInfo.error ||
      entityRequestInfo.deleting.busy ||
      entityRequestInfo.deleting.deleted ||
      entityRequestInfo.updating._root_.busy;
  }

  private shouldCallAction(entityRequestInfo: RequestInfoState, entity: T) {
    return !entityRequestInfo || (!entity && !this.isEntityChanging(entityRequestInfo));
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
