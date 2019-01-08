import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IApp } from '../../../../core/cf-api.types';
import {
  appDataSort,
  CloudFoundryEndpointService,
} from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { GetAppStatsAction } from '../../../../store/actions/app-metadata.actions';
import { AppState } from '../../../../store/app-state';
import { APIResource } from '../../../../store/types/api.types';

const RECENT_ITEMS_COUNT = 10;

@Component({
  selector: 'app-card-cf-recent-apps',
  templateUrl: './card-cf-recent-apps.component.html',
  styleUrls: ['./card-cf-recent-apps.component.scss'],
})
export class CardCfRecentAppsComponent implements OnInit {

  @Input() allApps$: Observable<APIResource<IApp>[]>;
  @Input() loading$: Observable<boolean>;
  @Output() refresh = new EventEmitter<any>();

  constructor(
    private store: Store<AppState>,
    public cfEndpointService: CloudFoundryEndpointService,
  ) { }

  apps$: Observable<APIResource<IApp>[]>;

  ngOnInit() {
    this.apps$ = this.allApps$.pipe(
      map(allApps => this.processApps(allApps))
    );
  }

  private processApps(apps: APIResource<IApp>[]): APIResource<IApp>[] {
    if (!apps) {
      return apps;
    }

    const recentApps = [].concat(apps).sort(appDataSort).slice(0, RECENT_ITEMS_COUNT);
    recentApps.forEach(app => {
      if (app.entity.state === 'STARTED') {
        this.store.dispatch(new GetAppStatsAction(app.metadata.guid, this.cfEndpointService.cfGuid));
      }
    });
    return recentApps;
  }

}


