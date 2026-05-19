import { Component, Input, OnInit, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
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
    AsyncPipe,
    DatePipe,
    RouterModule,
    ApplicationStateIconComponent
  ]
})
export class CompactAppCardComponent implements OnInit {
  private appStateService = inject(ApplicationStateService);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private statsRegistry = inject(AppStatsDataRegistry);


  @Input() app!: any;

  @Input() endpoint!: string;

  @Input() showDate = true;
  @Input() dateMode!: string;

  applicationState: Signal<ApplicationStateData> = signal({ label: '', indicator: StratosStatus.NONE, actions: null });

  appStatus: Signal<StratosStatus> = computed(() => this.applicationState().indicator);

  bcType!: any;
  ngOnInit() {
    if (this.activeRouteCfOrgSpace) {
      this.bcType = this.setBreadcrumbType(this.activeRouteCfOrgSpace);
      if (!this.endpoint) {
        this.endpoint = this.activeRouteCfOrgSpace.cfGuid;
      }
    }

    if (!this.app) {
      return;
    }

    const stats = this.statsRegistry.acquire(this.endpoint, this.app.metadata.guid);
    this.applicationState = computed(() => this.appStateService.get(this.app.entity, stats.stats()));
    stats.load().subscribe();
  }

  private setBreadcrumbType = (activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) => {
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
}
