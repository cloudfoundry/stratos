import { Component, ChangeDetectionStrategy, computed, effect, inject, input, untracked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { BREADCRUMB_URL_PARAM, ApplicationStateIconComponent } from '@stratosui/core';
import { StratosStatus } from '@stratosui/store';
import { AppStatsDataRegistry } from '../../../../services/endpoint-data/app-stats-data.registry';
import { ApplicationStateData, ApplicationStateService } from '../../../../shared/services/application-state.service';
import { ActiveRouteCfOrgSpace } from '../../../cf/cf-page.types';


@Component({
  selector: 'app-compact-app-card',
  templateUrl: './compact-app-card.component.html',
  styleUrls: ['./compact-app-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    ApplicationStateIconComponent
  ]
})
export class CompactAppCardComponent {
  private appStateService = inject(ApplicationStateService);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private statsRegistry = inject(AppStatsDataRegistry);

  // Null renders a placeholder row.
  readonly app = input<any>();

  readonly endpoint = input<string>();

  readonly showDate = input(true);
  readonly dateMode = input<string>();
  // Show the status from whatever stats are already cached; fetch none.
  readonly noStats = input(false);

  // The org/space summary pages don't pass an endpoint; take it from the route.
  readonly endpointGuid = computed(() => this.endpoint() || this.activeRouteCfOrgSpace?.cfGuid);

  readonly bcType = this.activeRouteCfOrgSpace ? breadcrumbType(this.activeRouteCfOrgSpace) : undefined;

  private readonly stats = computed(() => {
    const app = this.app();
    // strict: endpointGuid is set by the parent or the route whenever a real
    // app row renders.
    return app ? this.statsRegistry.acquire(this.endpointGuid()!, app.metadata.guid) : null;
  });

  readonly applicationState = computed<ApplicationStateData>(() => {
    const app = this.app();
    const stats = this.stats();
    if (!app || !stats) {
      return { label: '', indicator: StratosStatus.NONE, actions: null };
    }
    // Stats not fetched yet are unknown (null), not "no instances" ([]):
    // [] reads as a started app with no running instances.
    return this.appStateService.get(app.entity, stats.lastFetched() !== null ? stats.stats() : null);
  });

  readonly appStatus = computed(() => this.applicationState().indicator);

  constructor() {
    // Only a started app has instance stats. Re-runs when a refresh hands
    // the card a newly started app.
    effect(() => {
      const stats = this.stats();
      if (stats && !this.noStats() && this.app().entity.state === 'STARTED') {
        untracked(() => stats.load().subscribe());
      }
    });
  }
}

function breadcrumbType(activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
  let bcType = 'cf';
  if (activeRouteCfOrgSpace.cfGuid) {
    if (activeRouteCfOrgSpace.orgGuid) {
      bcType = 'org';
      if (activeRouteCfOrgSpace.spaceGuid) {
        bcType = 'space-summary';
      }
    }
  }
  return {
    [BREADCRUMB_URL_PARAM]: bcType
  };
}
