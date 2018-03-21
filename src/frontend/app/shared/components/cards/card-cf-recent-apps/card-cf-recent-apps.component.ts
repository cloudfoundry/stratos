import { Component, OnInit } from '@angular/core';
import { ListConfig, IListConfig, ListViewTypes } from '../../list/list.component.types';
import { ActivatedRoute } from '@angular/router';
import { ActiveRouteCfOrgSpace } from '../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../store/actions/list.actions';
import { TableCellAppNameComponent } from '../../list/list-types/app/table-cell-app-name/table-cell-app-name.component';
import { APIResource } from '../../../../store/types/api.types';
import { ITableColumn } from '../../list/list-table/table.types';
import { IApp, IOrganization, ISpace } from '../../../../core/cf-api.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { filter, map, concatMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';

function appDataSort(app1: APIResource<ISpace>, app2: APIResource<ISpace>): number {
  const app1Date = new Date(app1.metadata.updated_at);
  const app2Date = new Date(app2.metadata.updated_at);
  if (app1Date > app2Date) {
    return -1;
  }
  if (app1Date < app2Date) {
    return 1;
  }
  return 0;
}

@Component({
  selector: 'app-card-cf-recent-apps',
  templateUrl: './card-cf-recent-apps.component.html',
  styleUrls: ['./card-cf-recent-apps.component.scss'],
})
export class CardCfRecentAppsComponent implements OnInit {

  constructor(
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
        return [].concat(...orgs.map((org) => org.entity.spaces));
      }),
      map((spaces: APIResource<ISpace>[]) => {
        return spaces.filter((space) => !this.activeRouteCfOrgSpace.spaceGuid ||
          !!this.activeRouteCfOrgSpace.spaceGuid && space.metadata.guid === this.activeRouteCfOrgSpace.spaceGuid);
      }),
      map((spaces: APIResource<ISpace>[]) => {
        return [].concat(...spaces.map((space) => space.entity.apps)).sort(appDataSort);
      }),
    );
      // map((org: APIResource<IOrganization>) => )
    // .subscribe(orgs => {
    //   console.log(orgs);
    // });
  }

}


