import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import {
  appDataSort,
  CloudFoundryEndpointService,
} from '../../../../../../cloud-foundry/src/features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IApp } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';

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
        cfEntityCatalog.appStats.api.getMultiple(app.metadata.guid, this.cfEndpointService.cfGuid);
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


