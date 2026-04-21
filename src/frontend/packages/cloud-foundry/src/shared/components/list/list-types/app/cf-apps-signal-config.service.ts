import { Injectable, WritableSignal, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CnsiAppsSource } from '../../../../../services/data-sources/cnsi-apps-source';
import { MergeOrchestrator } from '../../../../../services/data-sources/merge-orchestrator';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StApp } from '../../../../../services/endpoint-data/stratos-types';

@Injectable({ providedIn: 'root' })
export class CfAppsSignalConfigService {
  orchestrator!: MergeOrchestrator<StApp>;
  view!: ViewPipeline<StApp>;

  readonly filter: WritableSignal<(app: StApp) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StApp>> = signal({ field: 'name' as keyof StApp, direction: 'asc' });
  readonly pageSize: WritableSignal<number> = signal(20);
  readonly pageIndex: WritableSignal<number> = signal(0);

  constructor(private readonly http: HttpClient) {}

  initialize(cnsiGuids: readonly string[]): void {
    const sources = cnsiGuids.map(guid => new CnsiAppsSource(guid, this.http));
    this.orchestrator = new MergeOrchestrator<StApp>(sources);
    this.view = new ViewPipeline<StApp>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
    );
  }

  async loadAll(): Promise<void> {
    await this.orchestrator.load();
  }

  async refresh(): Promise<void> {
    await this.orchestrator.refresh();
  }

  async deleteApp(cnsiGuid: string, appGuid: string): Promise<void> {
    const src = this.orchestrator.sourceFor(cnsiGuid) as CnsiAppsSource | undefined;
    if (!src) throw new Error(`no source for cnsi ${cnsiGuid}`);
    await src.delete(appGuid);
  }
}
