import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import type { StApp } from '../endpoint-data/stratos-types';

export class CnsiAppsSource extends CnsiEntitySource<StApp> {
  protected readonly entityName = 'apps';

  async delete(appGuid: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}`));
    this.patchItems(items => items.filter(a => (a as { guid?: string }).guid !== appGuid));
  }

  async update(appGuid: string, patch: Partial<StApp> & Record<string, unknown>): Promise<void> {
    const updated = await firstValueFrom(this.http.patch<StApp>(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}`, patch));
    this.patchItems(items => items.map(a => (a as { guid?: string }).guid === appGuid ? { ...a, ...updated } : a));
  }

  async action(appGuid: string, verb: 'start' | 'stop' | 'restart' | 'restage'): Promise<void> {
    const updated = await firstValueFrom(this.http.post<StApp>(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}/actions/${verb}`, null));
    this.patchItems(items => items.map(a => (a as { guid?: string }).guid === appGuid ? { ...a, ...updated } : a));
  }

  async deleteInstance(appGuid: string, index: number): Promise<void> {
    await firstValueFrom(this.http.delete(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}/instances/${index}`));
  }

  async assignRoute(appGuid: string, routeGuid: string): Promise<void> {
    await firstValueFrom(this.http.put(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}/routes/${routeGuid}`, {}));
  }
}
