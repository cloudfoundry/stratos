import { Component, ChangeDetectionStrategy, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { ActiveRouteCfCell } from '../../../../cf-page.types';
import {
  CfCellAppRow,
  CfCellAppsSignalConfigService,
} from '../../../../../../shared/components/list/list-types/cf-cell-apps/cf-cell-apps-signal-config.service';

@Component({
  selector: 'app-cloud-foundry-cell-apps',
  templateUrl: './cloud-foundry-cell-apps.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SignalListComponent],
})
export class CloudFoundryCellAppsComponent {
  private activeRoute = inject(ActiveRouteCfCell);
  private appsConfig = inject(CfCellAppsSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<CfCellAppRow> | undefined> = signal(undefined);

  constructor() {
    this.appsConfig.initialize(this.activeRoute.cfGuid, this.activeRoute.cellId);
    void this.appsConfig.loadAll();

    this.listConfig.set({
      pagedItems: this.appsConfig.view.pagedItems,
      totalFilteredResults: this.appsConfig.view.totalFilteredResults,
      totalPages: this.appsConfig.view.totalPages,
      pageIndex: this.appsConfig.pageIndex,
      pageSize: this.appsConfig.pageSize,
      isAnyLoading: computed(() => this.appsConfig.isLoading()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'App Name', key: 'name', sortField: 'name',
          kind: 'link',
          link: (r: CfCellAppRow) => ['/applications', r.cnsiGuid, r.appGuid, 'summary'],
          render: (r: CfCellAppRow) => r.name,
        },
        {
          header: 'App Instance', key: 'instance', sortField: 'instanceIndex',
          kind: 'link',
          link: (r: CfCellAppRow) => ['/applications', r.cnsiGuid, r.appGuid, 'instances'],
          render: (r: CfCellAppRow) => String(r.instanceIndex),
        },
        {
          header: 'Space', key: 'space', sortField: 'spaceName',
          kind: 'link',
          link: (r: CfCellAppRow) => r.orgGuid && r.spaceGuid
            ? ['/cloud-foundry', r.cnsiGuid, 'organizations', r.orgGuid, 'spaces', r.spaceGuid, 'summary']
            : null,
          render: (r: CfCellAppRow) => r.spaceName,
        },
        {
          header: 'Organization', key: 'org', sortField: 'orgName',
          kind: 'link',
          link: (r: CfCellAppRow) => r.orgGuid
            ? ['/cloud-foundry', r.cnsiGuid, 'organizations', r.orgGuid, 'summary']
            : null,
          render: (r: CfCellAppRow) => r.orgName,
        },
      ],
      getRowKey: (r: CfCellAppRow) => `${r.appGuid}:${r.instanceIndex}`,
      emptyMessage: 'There are no applications',
      loadingMessage: 'Loading apps…',
      onRefresh: () => this.appsConfig.refresh(),
      sort: this.appsConfig.sort,
    });
  }
}
