import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../../../core/cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../features/cloud-foundry/cf-page.types';
import {
  appDataSort,
  CloudFoundryEndpointService
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

  constructor(
    private store: Store<AppState>,
    private cfEndpointService: CloudFoundryEndpointService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) { }

  apps$: Observable<APIResource<ISpace>[]>;

  ngOnInit() {
    this.apps$ = this.cfEndpointService.orgs$.pipe(
      map((orgs: APIResource<IOrganization>[]) => {
        return orgs.filter((org) => !this.activeRouteCfOrgSpace.orgGuid ||
          !!this.activeRouteCfOrgSpace.orgGuid && org.metadata.guid === this.activeRouteCfOrgSpace.orgGuid);
      }),
      map((orgs: APIResource<IOrganization>[]) => {
        return [].concat(...orgs.map((org) => org.entity.spaces ? org.entity.spaces : []));
      }),
      map((spaces: APIResource<ISpace>[]) => {
        return spaces.filter((space) => !this.activeRouteCfOrgSpace.spaceGuid ||
          !!this.activeRouteCfOrgSpace.spaceGuid && space.metadata.guid === this.activeRouteCfOrgSpace.spaceGuid);
      }),
      map((spaces: APIResource<ISpace>[]) => {
        return [].concat(...spaces.map((space) => space.entity.apps)).slice(0, RECENT_ITEMS_COUNT).sort(appDataSort);
      }),
      first(),
      tap(apps => {
        apps.forEach(app => {
          if (app.entity.state === 'STARTED') {
            this.store.dispatch(new GetAppStatsAction(app.metadata.guid, this.activeRouteCfOrgSpace.cfGuid));
          }
        });
      })
    );
  }

}


