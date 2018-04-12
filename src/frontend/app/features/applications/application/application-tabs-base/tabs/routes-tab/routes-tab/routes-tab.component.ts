import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';

import {
  CfAppRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { ListConfig } from '../../../../../../../shared/components/list/list.component.types';
import { PaginationMonitorFactory } from '../../../../../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../../../../../store/app-state';
import { EntityInfo, APIResource } from '../../../../../../../store/types/api.types';
import { ApplicationService } from '../../../../../application.service';
import { FetchAllDomains } from '../../../../../../../store/actions/domains.actions';
import { getPaginationObservables } from '../../../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { entityFactory, domainSchemaKey } from '../../../../../../../store/helpers/entity-factory';

@Component({
  selector: 'app-routes-tab',
  templateUrl: './routes-tab.component.html',
  styleUrls: ['./routes-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfAppRoutesListConfigService
    }
  ]
})
export class RoutesTabComponent implements OnInit {

  paginationSubscription: Subscription;
  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private listConfig: ListConfig<EntityInfo>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
  }
  ngOnInit() {
    const { cfGuid } = this.appService;
    const action = new FetchAllDomains(cfGuid);
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

}
