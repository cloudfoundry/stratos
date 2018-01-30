import { PaginationEntityState } from '../../../store/types/pagination.types';
import { denormalize } from 'normalizr';
import { Observable, Subscription } from 'rxjs/Rx';
import { getAPIRequestDataState } from '../../../store/selectors/api.selectors';
import { map, tap, withLatestFrom, filter, toArray, distinctUntilChanged } from 'rxjs/operators';
import { ListConfig, IListConfig } from '../../../shared/components/list/list.component';
import { CfAppConfigService } from '../../../shared/list-configs/cf-app-config.service';
import { CardAppComponent } from '../../../shared/components/cards/custom-cards/card-app/card-app.component';
import { Component, OnDestroy } from '@angular/core';
import { animate, query, style, transition, trigger } from '@angular/animations';
import { EndpointsService } from '../../../core/endpoints.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { ApplicationSchema } from '../../../store/actions/application.actions';
import { CfAppsDataSource } from '../../../shared/data-sources/cf-apps-data-source';
import { ListDataSource, distinctPageUntilChanged } from '../../../shared/data-sources/list-data-source';
import { APIResource } from '../../../store/types/api.types';
import { GetAppStatsAction } from '../../../store/actions/app-metadata.actions';

@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss'],
  animations: [
    trigger(
      'cardEnter', [
        transition('* => *', [
          query(':enter', [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ], { optional: true })
        ])
      ]
    )
  ],
  providers: [{
    provide: ListConfig,
    useClass: CfAppConfigService
  }]
})
export class ApplicationWallComponent implements OnDestroy {

  private statsSub: Subscription;

  constructor(
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    private appListConfig: ListConfig,
  ) {
    const dataSource: ListDataSource<APIResource> = appListConfig.getDataSource();

    this.statsSub = dataSource.page$.pipe(
      // The page observable will fire often, here we're only interested in updating the stats on actual page changes
      distinctUntilChanged(distinctPageUntilChanged(dataSource)),
      withLatestFrom(dataSource.pagination$),
      tap(([page, pagination]) => {
        if (!page) {
          return;
        }
        page.forEach(app => {
          const appState = app.entity.state;
          const appGuid = app.entity.guid;
          const cfGuid = app.entity.cfGuid;
          const dispatching = false;
          if (appState === 'STARTED') {
            this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
          }
        });
      })
    ).subscribe();
  }

  cardComponent = CardAppComponent;

  ngOnDestroy(): void {
    this.statsSub.unsubscribe();
  }
}
