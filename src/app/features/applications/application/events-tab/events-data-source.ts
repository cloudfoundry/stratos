import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { MdPaginator, PageEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { EventSchema, GetAllAppEvents } from '../../../../store/actions/app-event.actions';
import { getPaginationObservables } from '../../../../store/reducers/pagination.reducer';
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
  private static paginationKey = 'application-events';

  constructor(private store: Store<AppState>, private _appService: ApplicationService, private _paginator: MdPaginator) {
    super();
    this._paginator.pageIndex = 0;

    this.showProgressIndicator = _appService.isFetchingApp$.combineLatest(
      this.isLoadingPage$,
    )
      .map(([isFetchingApp, isLoadingPage]) => isFetchingApp || isLoadingPage);

    this._paginator.page.startWith(this._defaultPaginator)
      .subscribe(pageEvent => {
        this.store.dispatch(new SetPage(ApplicationSchema.key, AppEventsDataSource.paginationKey, pageEvent.pageIndex));
      });
  }

  _defaultPaginator = {
    pageIndex: 1,
    pageSize: 5,
  };

  count$ = new BehaviorSubject(-1);
  isLoadingPage$: Observable<boolean>;

  showProgressIndicator: Observable<boolean>;



  connect(): Observable<AppEvent[]> {

    const {
    pagination$,
      entities$
  } = getPaginationObservables({
        store: this.store,
        action: new GetAllAppEvents(AppEventsDataSource.paginationKey, this._appService.appGuid),
        schema: [EventSchema]
      });
    this.isLoadingPage$ = pagination$.map(pag => pag.fetching);

    return Observable.combineLatest(
      pagination$
      , entities$
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
