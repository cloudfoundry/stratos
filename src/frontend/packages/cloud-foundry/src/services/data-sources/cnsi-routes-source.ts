import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';

export interface StRoute {
  guid: string;
  host?: string;
  path?: string;
  url?: string;
  cnsiGuid?: string;
}

export class CnsiRoutesSource extends CnsiEntitySource<StRoute> {
  protected readonly entityName = 'routes';

  async unmapApp(routeGuid: string, appGuid: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/pp/v1/cf/routes/${this.cnsiGuid}/${routeGuid}/apps/${appGuid}`));
  }
}
