import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
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

  appLink: () => void;
  detailsLoading$: Observable<boolean>;

  constructor() {
    this.appLink = () => {
      goToAppWall(this.store, this.cfEndpointService.cfGuid);
    };

    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      this.cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }
}
