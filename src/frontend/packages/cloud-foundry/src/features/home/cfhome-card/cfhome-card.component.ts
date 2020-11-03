import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { EndpointModel } from '../../../../../store/src/public-api';
import { CFAppState } from '../../../cf-app-state';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';
import { CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';
import { HomePageCardLayout } from './../../../../../core/src/features/home/home.types';


@Component({
  selector: 'app-cfhome-card',
  templateUrl: './cfhome-card.component.html',
  styleUrls: ['./cfhome-card.component.scss'],
  providers: [
    {
      provide: ActiveRouteCfOrgSpace,
      useValue: null,
    },
    CloudFoundryEndpointService
  ]
})
export class CFHomeCardComponent implements OnInit {

  @Input() endpoint: EndpointModel;

  _layout: HomePageCardLayout;


  get layout(): HomePageCardLayout {
    return this._layout;
  }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this._layout = value;
    }
    this.updateLayout();
  };

  recentAppsRows = 10;

  appLink: string;

  routeCount$: Observable<number>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private store: Store<CFAppState>,
    private pmf: PaginationMonitorFactory,
  ) {}

  ngOnInit(): void {
    const config = new ActiveRouteCfOrgSpace();
    config.cfGuid = this.endpoint.guid;
    this.cfEndpointService.init(config);
    this.routeCount$ = CloudFoundryEndpointService.fetchRouteCount(this.store, this.pmf, this.endpoint.guid)

    // TODO:
    // appLink = ?
  }

  public updateLayout() {
    this.recentAppsRows = this.layout.y > 1 ? 5 : 10;

    // Hide recent apps if more than 2 columns
    if (this.layout.x > 2) {
      this.recentAppsRows = 0;
    }
  }
}
