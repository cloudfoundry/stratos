import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import {
  appDataSort,
  CloudFoundryEndpointService,
} from '../../../../../../cloud-foundry/src/features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { IApp } from '../../../../../../core/src/core/cf-api.types';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { appStatsEntityType } from '../../../../cf-entity-types';

const RECENT_ITEMS_COUNT = 10;

@Component({
  selector: 'app-card-cf-recent-apps',
  templateUrl: './card-cf-recent-apps.component.html',
  styleUrls: ['./card-cf-recent-apps.component.scss'],
})
export class CardCfRecentAppsComponent implements OnInit {

  public recentApps$: Observable<APIResource<IApp>[]>;
  @Input() allApps$: Observable<APIResource<IApp>[]>;
  @Input() loading$: Observable<boolean>;
  @Output() refresh = new EventEmitter<any>();

  constructor(
    private store: Store<CFAppState>,
    public cfEndpointService: CloudFoundryEndpointService,
  ) { }

  ngOnInit() {
    this.recentApps$ = this.allApps$.pipe(
      filter(apps => !!apps),
      first(),
      map(apps => this.restrictApps(apps)),
      tap(apps => this.fetchAppStats(apps))
    );
  }

  private fetchAppStats(recentApps: APIResource<IApp>[]) {
    recentApps.forEach(app => {
      if (app.entity.state === 'STARTED') {
        const appStatsEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appStatsEntityType);
        const actionBuilder = appStatsEntity.actionOrchestrator.getActionBuilder('get');
        const getAppStatsAction = actionBuilder(app.metadata.guid, this.cfEndpointService.cfGuid);
        this.store.dispatch(getAppStatsAction);
      }
    });
  }

  private restrictApps(apps: APIResource<IApp>[]): APIResource<IApp>[] {
    if (!apps) {
      return [];
    }
    return apps.sort(appDataSort).slice(0, RECENT_ITEMS_COUNT);
  }

}


