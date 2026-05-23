import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import type { StApp } from '../endpoint-data/stratos-types';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';
import { writeWithJob } from '../async-jobs/write-with-job';

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

  async delete(appGuid: string): Promise<void> {
    // Route through writeWithJob so the Promise only resolves once CF's
    // async delete job is terminal (COMPLETE or, via thrown error, FAILED).
    // Callers that refresh the orchestrator immediately see a consistent
    // post-delete state instead of racing the CF v3 job.
    const call = this.http.delete(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}`, { observe: 'response' });
    await writeWithJob(this.http, call);
    this.patchItems(items => items.filter(a => (a as { guid?: string }).guid !== appGuid));
    this.eds?.removeApp(appGuid);
    this.eds?.applyCascade('app.delete');
  }

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
