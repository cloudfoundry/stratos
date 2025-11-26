import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { GeneralEntityAppState } from '@stratosui/store';

import {
  CardNumberMetricComponent,
  LoadingPageComponent,
  PageSubNavComponent,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
} from '@stratosui/core';

import { CardCfInfoComponent } from '../../../../shared/components/cards/card-cf-info/card-cf-info.component';
import { goToAppWall } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CardCfRecentAppsComponent } from '../../../home/card-cf-recent-apps/card-cf-recent-apps.component';

@Component({
  selector: 'app-cloud-foundry-summary-tab',
  templateUrl: './cloud-foundry-summary-tab.component.html',
  styleUrls: ['./cloud-foundry-summary-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    RouterModule,
    PageSubNavComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    LoadingPageComponent,
    CardNumberMetricComponent,
    CardCfInfoComponent,
    CardCfRecentAppsComponent,
  ],
})
export class CloudFoundrySummaryTabComponent {
  private store = inject(Store<GeneralEntityAppState>);
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
