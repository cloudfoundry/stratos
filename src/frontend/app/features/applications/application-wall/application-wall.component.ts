import { animate, query, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, HostBinding } from '@angular/core';
import { Store } from '@ngrx/store';
import { tag } from 'rxjs-spy/operators/tag';
import { debounceTime, distinctUntilChanged, filter, first, tap, withLatestFrom } from 'rxjs/operators';
import { Subscription } from 'rxjs/Rx';

import { EndpointsService } from '../../../core/endpoints.service';
import {
  distinctPageUntilChanged,
  ListDataSource,
} from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { CardAppComponent } from '../../../shared/components/list/list-types/app/card/card-app.component';
import { CfAppConfigService } from '../../../shared/components/list/list-types/app/cf-app-config.service';
import { CfAppsDataSource } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { GetAppStatsAction } from '../../../store/actions/app-metadata.actions';
import { AppState } from '../../../store/app-state';
import { applicationSchemaKey } from '../../../store/helpers/entity-factory';
import { selectPaginationState } from '../../../store/selectors/pagination.selectors';
import { APIResource } from '../../../store/types/api.types';
import { CloudFoundryEndpointService } from '../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';

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
  },
    CfOrgSpaceDataService]
})
export class ApplicationWallComponent implements OnDestroy {

  private statsSub: Subscription;
  private initCfOrgSpaceService: Subscription;

  constructor(
    public cloudFoundryService: CloudFoundryService,
    private store: Store<AppState>,
    private appListConfig: ListConfig<APIResource>,
    private cfOrgSpaceService: CfOrgSpaceDataService
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

    this.initCfOrgSpaceService = this.store.select(selectPaginationState(applicationSchemaKey, CfAppsDataSource.paginationKey)).pipe(
      filter((pag) => !!pag),
      first(),
      tap(pag => {
        if (pag.clientPagination.filter.items.cf) {
          this.cfOrgSpaceService.cf.select.next(pag.clientPagination.filter.items.cf);
        }
        if (pag.clientPagination.filter.items.org) {
          this.cfOrgSpaceService.org.select.next(pag.clientPagination.filter.items.org);
        }
        if (pag.clientPagination.filter.items.space) {
          this.cfOrgSpaceService.space.select.next(pag.clientPagination.filter.items.space);
        }
      })
    ).subscribe();
  }

  cardComponent = CardAppComponent;

  ngOnDestroy(): void {
    this.statsSub.unsubscribe();
    this.initCfOrgSpaceService.unsubscribe();
  }
}
