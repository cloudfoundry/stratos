import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import type { StApp } from '../endpoint-data/stratos-types';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

export class CnsiAppsSource extends CnsiEntitySource<StApp> {
  protected readonly entityName = 'apps';

  // EDS is optional so existing call sites that haven't been threaded
  // yet (cold bookmark / HMR fallback paths) keep working without it.
  // When provided, mutations also patch EDS._apps and fire cascade
  // markers so the cross-tab staleness model triggers.
  constructor(
    cnsiGuid: string,
    http: HttpClient,
    private readonly eds?: EndpointDataService,
    pageSize: number = 100,
  ) {
    super(cnsiGuid, http, pageSize);
  }

  // Apps are drained per endpoint by EndpointDataService (home cards, detail
  // views, the pre-warm queue). Draining them again here duplicates that
  // work: the caller used to hand us a finished cache via preSeed(), which
  // covered a *completed* drain but not one still in flight — mount the wall
  // mid-drain and both ran. loadApps() closes that window: warm cache, live
  // in-flight observable, or a fresh drain, whichever applies. Both URL
  // shapes return the same enriched rows (verified field-by-field against a
  // live foundation: identical keys, routes included), so there's nothing
  // the per-source `?return=summary` drain was adding.
  //
  // Falls back to the base drain when no EDS was threaded in — the cold
  // bookmark / HMR paths the constructor comment describes.
  override async load(): Promise<void> {
    if (!this.eds) return super.load();
    this.setLoading(true);
    try {
      await firstValueFrom(this.eds.loadApps());
      this.preSeed(this.eds.apps());
    } finally {
      this.setLoading(false);
    }
  }

  // refresh() is user-driven ("give me current data"), so it must bypass the
  // shared cache rather than join it — refreshApps() re-drains unconditionally.
  override async refresh(): Promise<void> {
    if (!this.eds) return super.refresh();
    this.setLoading(true);
    try {
      await firstValueFrom(this.eds.refreshApps());
      this.preSeed(this.eds.apps());
    } finally {
      this.setLoading(false);
    }
  }

  // NOTE: app delete routes through EntityDeleteController (see
  // CfAppsSignalConfigService.deleteApp); create/update/action stay here.

  async update(appGuid: string, patch: Partial<StApp> & Record<string, unknown>): Promise<void> {
    const updated = await firstValueFrom(this.http.patch<StApp>(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}`, patch));
    this.patchItems(items => items.map(a => (a as { guid?: string }).guid === appGuid ? { ...a, ...updated } : a));
    this.eds?.updateApp(appGuid, updated);
    this.eds?.applyCascade('app.update');
  }

  async create(payload: unknown): Promise<StApp> {
    const created = await firstValueFrom(this.http.post<StApp>(`/pp/v1/cf/apps/${this.cnsiGuid}`, payload));
    this.patchItems(items => [...items, created]);
    this.eds?.addApp(created);
    this.eds?.applyCascade('app.create');
    return created;
  }

  async action(appGuid: string, verb: 'start' | 'stop' | 'restart' | 'restage'): Promise<void> {
    const updated = await firstValueFrom(this.http.post<StApp>(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}/actions/${verb}`, null));
    this.patchItems(items => items.map(a => (a as { guid?: string }).guid === appGuid ? { ...a, ...updated } : a));
    this.eds?.updateApp(appGuid, updated);
    // Lifecycle verbs don't cascade — they only change app state, not the
    // set of related entities. No applyCascade() call.
  }

  async deleteInstance(appGuid: string, index: number): Promise<void> {
    await firstValueFrom(this.http.delete(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}/instances/${index}`));
  }

  async assignRoute(appGuid: string, routeGuid: string): Promise<void> {
    await firstValueFrom(this.http.put(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}/routes/${routeGuid}`, {}));
    // Route binding affects the app's route mappings; cascade tells other
    // surfaces (route lists, app summary route panel) to refetch.
    this.eds?.applyCascade('route.create');
  }
}
