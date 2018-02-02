import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';

import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { ListConfig } from '../../../shared/components/list/list.component';
import { CfAppRoutesDataSource } from '../../../shared/data-sources/cf-app-routes-data-source';
import { CfAppRoutesListConfigService } from '../../../shared/list-configs/cf-app-routes-list-config.service';
import { DomainSchema, FetchAllDomains } from '../../../store/actions/domains.actions';
import { AppState } from '../../../store/app-state';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../store/types/api.types';
import { ApplicationService } from '../application.service';

@Component({
  selector: 'app-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfAppRoutesListConfigService
    }
  ]
})
export class RoutesComponent implements OnInit, OnDestroy {
  paginationSubscription: Subscription;
  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private listConfig: ListConfig,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.routesDataSource = listConfig.getDataSource() as CfAppRoutesDataSource;
  }

  routesDataSource: CfAppRoutesDataSource;

  ngOnInit() {
    const { cfGuid } = this.appService;
    this.paginationSubscription = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action: new FetchAllDomains(cfGuid),
        schema: [DomainSchema]
      },
      true
    ).entities$.subscribe();
  }

  ngOnDestroy(): void {
    this.paginationSubscription.unsubscribe();
  }
}
