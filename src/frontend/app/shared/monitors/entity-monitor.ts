import { RequestInfoState, rootUpdatingKey, UpdatingSection, getDefaultActionState } from './../../store/reducers/api-request-reducer/types';
import { Observable } from 'rxjs/Rx';
import { schema } from 'normalizr';
import { AppState } from './../../store/app-state';
import { Store } from '@ngrx/store';
import { selectEntity, selectRequestInfo } from '../../store/selectors/api.selectors';
import { shareReplay, distinctUntilChanged, map, filter } from 'rxjs/operators';

export class EntityMonitor<T> {
    constructor(
        private store: Store<AppState>,
        public entityKey: string,
        public schema: schema.Entity,
        public id: string
    ) {
        this.entity$ = store.select(selectEntity<T>(entityKey, id)).pipe(
            shareReplay(1)
        );
        this.entityRequest$ = store.select(selectRequestInfo(entityKey, id)).pipe(
            filter(request => !!request),
            shareReplay(1),
        );
        this.isDeletingEntity$ = this.entityRequest$.map(request => request.deleting.busy).pipe(
            distinctUntilChanged(),
            shareReplay(1)
        );
        this.isFetchingEntity$ = this.entityRequest$.map(request => request.fetching).pipe(
            distinctUntilChanged(),
            shareReplay(1)
        );
        this.updatingSection$ = this.entityRequest$.map(request => request.updating).pipe(
            distinctUntilChanged(),
            shareReplay(1)
        );
    }
    private updatingSectionObservableCache: {
        [key: string]: UpdatingSection
    };
    private updatingSection$: Observable<UpdatingSection>;
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
        return this.updatingSection$.pipe(
            map(updates => {
                return updates[updatingKey] || getDefaultActionState();
            })
        );
    }


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
                this.entity$,
                this.entityRequest$
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
