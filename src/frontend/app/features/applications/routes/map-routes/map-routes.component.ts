import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import {
  CfAppMapRoutesListConfigService,
} from '../../../../shared/components/list/list-types/app-route/cf-app-map-routes-list-config.service';
import { CfAppRoutesDataSource } from '../../../../shared/components/list/list-types/app-route/cf-app-routes-data-source';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { FetchAllDomains } from '../../../../store/actions/domains.actions';
import { AppState } from '../../../../store/app-state';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/types/api.types';
import { ApplicationService } from '../../application.service';
import { entityFactory } from '../../../../store/helpers/entity-factory';
import { domainSchemaKey } from '../../../../store/helpers/entity-factory';

@Component({
  selector: 'app-map-routes',
  templateUrl: './map-routes.component.html',
  styleUrls: ['./map-routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfAppMapRoutesListConfigService
    }
  ]
})
export class MapRoutesComponent implements OnInit, OnDestroy {
  paginationSubscription: any;
  subscription: Subscription;
  @Input() selectedRoute$: BehaviorSubject<APIResource>;

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    listConfig: ListConfig<APIResource>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.routesDataSource = listConfig.getDataSource() as CfAppRoutesDataSource;
  }
  routesDataSource: CfAppRoutesDataSource;
  ngOnInit() {
    this.subscription = this.routesDataSource.selectedRows$
      .pipe(
        tap(routes => {
          const selectedRow = Array.from(routes.values());
          if (selectedRow.length) {
            this.selectedRoute$.next(selectedRow[0]);
          }
        })
      )
      .subscribe();

    const action = new FetchAllDomains(this.appService.cfGuid);
    this.paginationSubscription = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(domainSchemaKey)
        )
      },
      true
    ).entities$.subscribe();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.paginationSubscription.unsubscribe();
  }
}
