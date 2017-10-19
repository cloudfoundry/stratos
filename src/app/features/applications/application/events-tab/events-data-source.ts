import { resultPerPageParam } from '../../../../store/effects/api.effects';
import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { MdPaginator, PageEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { EventSchema, GetAllAppEvents } from '../../../../store/actions/app-event.actions';
import { getPaginationObservables, PaginationEntityState } from '../../../../store/reducers/pagination.reducer';
import { SetPage } from '../../../../store/actions/pagination.actions';
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

  constructor(private store: Store<AppState>, private _appService: ApplicationService, private _paginator: MdPaginator) {
    super();
    this._paginator.pageIndex = 0;


    this._paginator.page
      .subscribe(pageEvent => {
        this.store.dispatch(new SetPage(EventSchema.key, AppEventsDataSource.paginationKey, pageEvent.pageIndex + 1));
      });

    const { pagination$, entities$ } = getPaginationObservables({
      store: this.store,
      action: this.action,
      schema: [EventSchema]
    });

    this.pagination$ = pagination$;
    this.entities$ = entities$;
  }

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
        this._paginator.pageSize = parseInt(pag.params[resultPerPageParam] as string, 10);
      }),
      this.entities$
    )
      .map(([paginationEntity, data]) => {
        this._paginator.length = paginationEntity.totalResults || data.length; // TODO: RC FIXME
        this.count$.next(this._paginator.length);
        return data;
      });
  }

  disconnect() {
  }
}
