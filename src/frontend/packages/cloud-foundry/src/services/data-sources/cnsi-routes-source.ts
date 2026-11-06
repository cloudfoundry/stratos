import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

export interface StRoute {
  guid: string;
  host?: string;
  path?: string;
  url?: string;
  cnsiGuid?: string;
}

export class CnsiRoutesSource extends CnsiEntitySource<StRoute> {
  protected readonly entityName = 'routes';

  constructor(
    cnsiGuid: string,
    http: HttpClient,
    private readonly eds?: EndpointDataService,
    pageSize: number = 100,
  ) {
    super(cnsiGuid, http, pageSize);
  }

  // NOTE: route delete routes through EntityDeleteController (see
  // CfRoutesSignalConfigService.deleteRoute + CfAppsSignalConfigService.
  // deleteRoute); create + unmapApp (relationship-only) stay here.

  async create(payload: unknown): Promise<StRoute> {
    const created = await firstValueFrom(this.http.post<StRoute>(`/pp/v1/cf/routes/${this.cnsiGuid}`, payload));
    this.patchItems(items => [...items, created]);
    this.eds?.applyCascade('route.create');
    return created;
  }

  async unmapApp(routeGuid: string, appGuid: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/pp/v1/cf/routes/${this.cnsiGuid}/${routeGuid}/apps/${appGuid}`));
    // Unmapping doesn't delete the route — only the binding. Apps need
    // refetching since route mappings on each app changed.
    this.eds?.applyCascade('route.delete');
  }
}
