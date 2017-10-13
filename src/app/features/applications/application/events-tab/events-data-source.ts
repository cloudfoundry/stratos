import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { MdPaginator, PageEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { EventSchema, GetAllAppEvents } from '../../../../store/actions/app-event.actions';
import { getCurrentPage } from '../../../../store/reducers/pagination.reducer';

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
    ).map(([isFetchingApp, isLoadingPage]: [boolean, boolean]) => {
      console.log(isFetchingApp);
      console.log(isLoadingPage);
      return isFetchingApp || isLoadingPage;
    });
  }

  _defaultPaginator = {
    pageIndex: 1,
    pageSize: 5,
  };

  count$ = new BehaviorSubject(-1);
  isLoadingPage$ = new BehaviorSubject(false);

  showProgressIndicator: Observable<boolean>;

  connect(): Observable<AppEvent[]> {
    return this._paginator.page.startWith(this._defaultPaginator)
      .mergeMap((pageEvent: PageEvent) => {
        console.log('PAGE EVENT: ', pageEvent);

        return getCurrentPage({
          entityType: EventSchema.key,
          paginationKey: AppEventsDataSource.paginationKey,
          store: this.store,
          action: new GetAllAppEvents(AppEventsDataSource.paginationKey, pageEvent.pageIndex, pageEvent.pageSize, this._appService.appGuid),
          schema: [EventSchema]
        });
        // this.isFetching = getObs$.mergeMap(({ paginationEntity }) => {
        //   return Observable.of(paginationEntity.fetching);
        // });

        // this.wallSub = getObs$
        //   .delay(100)
        //   .subscribe(({ paginationEntity, data }) => {
        //     this.error = paginationEntity.error;
        //     if (!paginationEntity.fetching) {
        //       if (!paginationEntity.error) {
        //         this.applications = data.map(getAPIResourceEntity);
        //       }
        //     }
        //   });

        // return [];
      })
      .do(({ paginationEntity, data }) => {
        console.log(paginationEntity);
        console.log(data);
        this.isLoadingPage$.next(paginationEntity.fetching);
      })
      .filter(({ paginationEntity, data }) => {
        return !paginationEntity.fetching;
      })
      .map(({ paginationEntity, data }) => {
        this._paginator.length = paginationEntity.totalResults || data.length; // TODO: RC FIXME
        this.count$.next(this._paginator.length);
        return data;
      });
  }

  disconnect() {
  }
}
