import { CommonModule } from '@angular/common';
import { Component, Injector, Signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { Store } from '@stratosui/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import {
  PageSubNavComponent,
  TileGridComponent,
  TileGroupComponent,
  TileComponent,
  LoadingPageComponent,
  CardNumberMetricComponent
} from '@stratosui/core';
import { CFAppState } from '../../../../cf-app-state';
import { goToAppWall } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CardCfInfoComponent } from '../../../../shared/components/cards/card-cf-info/card-cf-info.component';
import { CardCfRecentAppsComponent } from '../../../home/card-cf-recent-apps/card-cf-recent-apps.component';
import { PollingIndicatorComponent } from '../../../../../../core/src/shared/components/polling-indicator/polling-indicator.component';
import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';

@Component({
  selector: 'app-cloud-foundry-summary-tab',
  templateUrl: './cloud-foundry-summary-tab.component.html',
  styleUrls: ['./cloud-foundry-summary-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageSubNavComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    LoadingPageComponent,
    CardNumberMetricComponent,
    CardCfInfoComponent,
    CardCfRecentAppsComponent,
    PollingIndicatorComponent
  ]
})
export class CloudFoundrySummaryTabComponent {
  private store = inject(Store<CFAppState>);
  public cfEndpointService = inject(CloudFoundryEndpointService);
  private registry = inject(EndpointDataRegistry);
  private injector = inject(Injector);

  appLink: () => void;
  detailsLoading$: Observable<boolean>;
  // Signal-native org count from EndpointDataService — populated by the
  // home-card load() fast path and refreshed by loadDetails(). Replaces
  // `(cfEndpointService.orgs$ | async)?.length` which read from the ngrx
  // pagination cache and could lag behind the actual CAPI total
  // (returning a stale partial like "1 Org" until the user navigated to
  // the Orgs page and back). The same EndpointDataService backs the Orgs
  // page's signal config, so both surfaces stay consistent.
  orgCount$: Observable<number>;

  constructor() {
    this.appLink = () => {
      goToAppWall(this.store, this.cfEndpointService.cfGuid);
    };

    const endpointData = this.registry.acquire(this.cfEndpointService.cfGuid);
    this.orgCount$ = toObservable(endpointData.orgCount as Signal<number>, { injector: this.injector });

    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      this.cfEndpointService.appsLoading$.pipe(
        filter(loading => !loading)
      ),
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }
}
