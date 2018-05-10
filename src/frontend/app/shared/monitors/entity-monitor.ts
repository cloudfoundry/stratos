import { Store, compose } from '@ngrx/store';
import { denormalize, schema } from 'normalizr';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { distinctUntilChanged, filter, map, publishReplay, refCount, startWith, withLatestFrom, tap, share } from 'rxjs/operators';
import { Observable } from 'rxjs/Rx';
import {
  getAPIRequestDataState,
  selectEntity,
  selectRequestInfo,
  getUpdateSectionById,
  getEntityUpdateSections
} from '../../store/selectors/api.selectors';
import { IRequestDataState } from '../../store/types/entity.types';
import { AppState } from './../../store/app-state';
import {
  ActionState,
  getDefaultActionState,
  getDefaultRequestState,
  RequestInfoState,
  UpdatingSection,
} from './../../store/reducers/api-request-reducer/types';
import { tag } from 'rxjs-spy/operators/tag';

export class EntityMonitor<T = any> {
  constructor(
    private store: Store<AppState>,
    public id: string,
    public entityKey: string,
    public schema: schema.Entity,
  ) {
    const defaultRequestState = getDefaultRequestState();
    this.entityRequest$ = store.select(selectRequestInfo(entityKey, id)).pipe(
      map(request => request ? request : defaultRequestState),
      distinctUntilChanged(),
      startWith(defaultRequestState),
      publishReplay(1), refCount()
    );
    this.isDeletingEntity$ = this.entityRequest$.map(request => request.deleting.busy).pipe(
      distinctUntilChanged()
    );
    this.isFetchingEntity$ = this.entityRequest$.map(request => request.fetching).pipe(
      distinctUntilChanged()
    );
    this.updatingSection$ = this.entityRequest$.map(request => request.updating).pipe(
      distinctUntilChanged(),
    );
    this.apiRequestData$ = this.store.select(getAPIRequestDataState).publishReplay(1).refCount();
    this.entity$ = this.getEntityObservable(
      schema,
      store.select(selectEntity<T>(entityKey, id)),
      this.entityRequest$,
      store.select(getAPIRequestDataState),
    );
  }
  private updatingSectionObservableCache: {
    [key: string]: Observable<ActionState>
  } = {};
  private apiRequestData$: Observable<IRequestDataState>;
  public updatingSection$: Observable<UpdatingSection>;
  /**
   * An observable that emit the entity from the store.
   */
  public entity$: Observable<T>;
  /**
   * An observable that emits the request information from the entity.
   */
  public entityRequest$: Observable<RequestInfoState>;
  /**
  * An observable that emits a boolean indicating if the entity is being fetched or not.
  */
  public isFetchingEntity$: Observable<boolean>;
  /**
  * An observable that emits a boolean indicating if the entity is being deleted or not.
  */
  public isDeletingEntity$: Observable<boolean>;

  /**
   * Returns an observable that will emit the updating section that corresponds to the key provided.
   * @param updatingKey The key to identify the updating you want to monitor.
   */
  public getUpdatingSection(updatingKey: string) {
    if (this.updatingSectionObservableCache[updatingKey]) {
      return this.updatingSectionObservableCache[updatingKey];
    } else {
      const updateObs$ = this.updatingSection$.pipe(
        map(updates => {
          return updates[updatingKey] || getDefaultActionState();
        })
      );
      this.updatingSectionObservableCache[updatingKey] = updateObs$;
      return updateObs$;
    }
  }

  private getEntityObservable = (
    schema: schema.Entity,
    entitySelect$: Observable<T>,
    entityRequestSelect$: Observable<RequestInfoState>,
    entities$: Observable<IRequestDataState>
  ): Observable<T> => {
    return combineLatest(
      entitySelect$,
      entityRequestSelect$
    ).pipe(
      filter(([entity, entityRequestInfo]) => {
        return !!entityRequestInfo && !!entity;
      }),
      withLatestFrom(entities$),
      map(([
        [entity, entityRequestInfo],
        entities
      ]) => {
        return entity ? denormalize(entity, schema, entities) : null;
      }),
      distinctUntilChanged(),
      startWith(null)
    );
  }

  /**
   * @param interval - The polling interval in ms.
   * @param updateKey - The store updating key for the poll
   */
  poll(interval = 10000, action: Function, getActionState: (request: RequestInfoState) => ActionState) {
    return Observable.interval(interval)
      .pipe(
        tag('poll'),
        withLatestFrom(
          this.entity$,
          this.entityRequest$
        ),
        map(([poll, resource, requestState]) => ({
          resource,
          updatingSection: getActionState(requestState)
        })),
        tap(({ resource, updatingSection }) => {
          if (!updatingSection || !updatingSection.busy) {
            action();
          }
        }),
        filter(({ resource, updatingSection }) => {
          return !!updatingSection;
        }),
        share()
      );
  }

}
