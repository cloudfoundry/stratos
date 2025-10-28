import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { PageSubNavComponent } from '@stratosui/core';
import { TileGridComponent } from '@stratosui/core';
import { TileGroupComponent } from '@stratosui/core';
import { TileComponent } from '@stratosui/core';
import { LoadingPageComponent } from '@stratosui/core';
import { CardNumberMetricComponent } from '@stratosui/core';
import { CFAppState } from '../../../../cf-app-state';
import { goToAppWall } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CardCfInfoComponent } from '../../../../shared/components/cards/card-cf-info/card-cf-info.component';
import { CardCfRecentAppsComponent } from '../../../home/card-cf-recent-apps/card-cf-recent-apps.component';

@Component({
  selector: 'app-cloud-foundry-summary-tab',
  templateUrl: './cloud-foundry-summary-tab.component.html',
  styleUrls: ['./cloud-foundry-summary-tab.component.scss'],
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
    CardCfRecentAppsComponent
  ]
})
export class CloudFoundrySummaryTabComponent {
  appLink: () => void;
  detailsLoading$: Observable<boolean>;

  constructor(store: Store<CFAppState>, public cfEndpointService: CloudFoundryEndpointService) {
    this.appLink = () => {
      goToAppWall(store, cfEndpointService.cfGuid);
    };

    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }
}
