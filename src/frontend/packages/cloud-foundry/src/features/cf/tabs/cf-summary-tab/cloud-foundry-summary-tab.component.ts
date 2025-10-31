import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { PageSubNavComponent } from '../../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { TileGridComponent } from '../../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../../../core/src/shared/components/tile/tile/tile.component';
import { LoadingPageComponent } from '../../../../../../core/src/shared/components/loading-page/loading-page.component';
import { CardNumberMetricComponent } from '../../../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';
import { CFAppState } from '../../../../cf-app-state';
import { goToAppWall } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CardCfInfoComponent } from '../../../../shared/components/cards/card-cf-info/card-cf-info.component';
import { CardCfRecentAppsComponent } from '../../../home/card-cf-recent-apps/card-cf-recent-apps.component';

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
    CardCfRecentAppsComponent
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
