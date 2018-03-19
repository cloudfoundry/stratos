import { animate, query, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { tag } from 'rxjs-spy/operators/tag';
import { distinctUntilChanged, tap, withLatestFrom, delay, debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs/Rx';

import { EndpointsService } from '../../../core/endpoints.service';
import {
  distinctPageUntilChanged,
  ListDataSource,
} from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { CardAppComponent } from '../../../shared/components/list/list-types/app/card/card-app.component';
import { CfAppConfigService } from '../../../shared/components/list/list-types/app/cf-app-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { GetAppStatsAction } from '../../../store/actions/app-metadata.actions';
import { AppState } from '../../../store/app-state';
import { APIResource } from '../../../store/types/api.types';

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
    private appListConfig: ListConfig<APIResource>,
  ) {
    const dataSource: ListDataSource<APIResource> = appListConfig.getDataSource();

    this.statsSub = dataSource.page$.pipe(
      // The page observable will fire often, here we're only interested in updating the stats on actual page changes
      distinctUntilChanged(distinctPageUntilChanged(dataSource)),
      withLatestFrom(dataSource.pagination$),
      // Ensure we keep pagination smooth
      debounceTime(250),
      tap(([page, pagination]) => {
        if (!page) {
          return;
        }
        page.forEach(app => {
          const appState = app.entity.state;
          const appGuid = app.metadata.guid;
          const cfGuid = app.entity.cfGuid;
          const dispatching = false;
          if (appState === 'STARTED') {
            this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
          }
        });
      }),
      tag('stat-obs')).subscribe();
  }

  cardComponent = CardAppComponent;

  ngOnDestroy(): void {
    this.statsSub.unsubscribe();
  }
}
