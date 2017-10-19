import { Subscription } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { MdPaginator, PageEvent, MdSort, Sort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { EventSchema, GetAllAppEvents } from '../../../../store/actions/app-event.actions';
import {
  getPaginationObservables,
  PaginationEntityState,
  resultPerPageParam,
} from '../../../../store/reducers/pagination.reducer';
import { AddParams, RemoveParams, SetPage } from '../../../../store/actions/pagination.actions';
import { ApplicationSchema } from '../../../../store/actions/application.actions';

interface AppEvent {
  actee_name: string;
  actee_type: string;
  actor: string;
  actor_name: string;
  actor_type: string;
  actor_username: string;
  metadata: Object;
  organization_guid: string;
  space_guid: string;
  timestamp: string;
  type: string;
}

export class AppEventsDataSource extends DataSource<AppEvent> {
  public static paginationKey = 'application-events';
  private action = new GetAllAppEvents(AppEventsDataSource.paginationKey, this._appService.appGuid, this._appService.cfGuid);

  sortSub: Subscription;
  paginationSub: Subscription;

  constructor(
    private store: Store<AppState>,
    private _appService: ApplicationService,
    private _paginator: MdPaginator,
    private _sort: MdSort
  ) {
    super();
    this._paginator.pageIndex = 0;
    this._paginator.pageSizeOptions = [5, 10, 20];

    const { pagination$, entities$ } = getPaginationObservables({
      store: this.store,
      action: this.action,
      schema: [EventSchema]
    });

    const pageSize$ = this._paginator.page.map(pageEvent => pageEvent.pageSize)
      .distinctUntilChanged()
      .withLatestFrom(pagination$)
      .do(([pageSize, pag]) => {
        if (pag.params[resultPerPageParam] !== pageSize) {
          this.store.dispatch(new AddParams(EventSchema.key, AppEventsDataSource.paginationKey, {
            [resultPerPageParam]: pageSize
          }));
        }
      });

    this.sortSub = this._sort.mdSortChange.subscribe((sort: Sort) => {
      this.store.dispatch(new AddParams(EventSchema.key, AppEventsDataSource.paginationKey, {
        'sort-by': sort.active,
        'order-direction': sort.direction
      }));
    });

    const pageIndex$ = this._paginator.page.map(pageEvent => pageEvent.pageIndex)
      .distinctUntilChanged()
      .do(pageIndex => this.store.dispatch(new SetPage(EventSchema.key, AppEventsDataSource.paginationKey, pageIndex + 1)));

    this.paginationSub = Observable.combineLatest(
      pageSize$,
      pageIndex$
    ).subscribe();

    this.pagination$ = pagination$;
    this.entities$ = entities$;
  }

  currentPageSize = 0;
  currentPage = 0;

  _defaultPaginator = {
    pageIndex: 0,
    pageSize: 5,
  };

  count$ = new BehaviorSubject(-1);
  isLoadingPage$: Observable<boolean>;

  showProgressIndicator: Observable<boolean>;

  pagination$: Observable<PaginationEntityState>;
  entities$: Observable<any>;

  connect(): Observable<AppEvent[]> {

    this.isLoadingPage$ = this.pagination$.map(pag => pag.fetching);

    return Observable.combineLatest(
      this.pagination$.do(pag => {
        this.currentPage = pag.currentPage;
        this.currentPageSize = parseInt(pag.params[resultPerPageParam] as string, 10);
        this._paginator.pageIndex = this.currentPage - 1;
        this._paginator.pageSize = this.currentPageSize;
        this._paginator.length = pag.totalResults; // TODO: RC FIXME
        // this.count$.next(this._paginator.length);
      }),
      this.entities$
    )
      .map(([paginationEntity, data]) => {
        return data;
      });
  }

  disconnect() {
    this.sortSub.unsubscribe();
    this.paginationSub.unsubscribe();
  }
}
