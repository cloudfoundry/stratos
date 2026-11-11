import { Component, inject, ChangeDetectionStrategy, computed, linkedSignal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import {
  PageSubNavComponent,
  TileGridComponent,
  TileGroupComponent,
  TileComponent,
  LoadingPageComponent,
  CardNumberMetricComponent
} from '@stratosui/core';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CfAppsSignalConfigService } from '../../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CardCfInfoComponent } from '../../../../shared/components/cards/card-cf-info/card-cf-info.component';
import { CardCfRecentAppsComponent } from '../../../home/card-cf-recent-apps/card-cf-recent-apps.component';
import { PollingIndicatorComponent } from '../../../../../../core/src/shared/components/polling-indicator/polling-indicator.component';
import { CfCliMenuComponent } from '../../../../shared/components/cli-menu/cf-cli-menu.component';

@Component({
  selector: 'app-cloud-foundry-summary-tab',
  templateUrl: './cloud-foundry-summary-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RouterModule,
    PageSubNavComponent,
    CfCliMenuComponent,
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
  private appsConfig = inject(CfAppsSignalConfigService);
  private router = inject(Router);
  public cfEndpointService = inject(CloudFoundryEndpointService);

  appLink: () => void;
  // Signal-native org count from EndpointDataService — populated by the
  // home-card load() fast path and refreshed by loadDetails(). Replaces
  // `(cfEndpointService.orgs$ | async)?.length` which read from the ngrx
  // pagination cache and could lag behind the actual CAPI total
  // (returning a stale partial like "1 Org" until the user navigated to
  // the Orgs page and back). The same EndpointDataService backs the Orgs
  // page's signal config, so both surfaces stay consistent.
  readonly orgCount = this.cfEndpointService.endpointData.orgCount;

  // True until the apps first report "not loading", then false for good: a
  // later refresh must not swap the cards back to the loading page. Whether
  // apps exist decides which small cards are shown.
  private readonly appsSettled = linkedSignal<boolean, boolean>({
    source: this.cfEndpointService.appsLoading,
    computation: (loading, previous) => !!previous?.value || !loading,
  });
  readonly detailsLoading = computed(() => !this.appsSettled());

  constructor() {
    this.appLink = () => {
      // The tile means "every app in this CF", so drop any org/space scope a
      // previous mount left on the root-singleton config. The Applications tab
      // can't do this itself: it keeps the existing org/space so that returning
      // from an app detail page preserves the filter the user set there.
      this.appsConfig.selectedOrg.set(null);
      this.appsConfig.selectedSpace.set(null);
      this.router.navigate(['/cloud-foundry', this.cfEndpointService.cfGuid, 'applications']);
    };
  }
}
