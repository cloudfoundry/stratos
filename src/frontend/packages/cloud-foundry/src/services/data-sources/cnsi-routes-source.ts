import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';
import { writeWithJob } from '../async-jobs/write-with-job';

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

  async delete(routeGuid: string): Promise<void> {
    const call = this.http.delete(
      `/pp/v1/cf/routes/${this.cnsiGuid}/${routeGuid}`,
      { observe: 'response' },
    );
    await writeWithJob(this.http, call);
    this.patchItems(items => items.filter(r => r.guid !== routeGuid));
    this.eds?.applyCascade('route.delete');
  }

  async unmapApp(routeGuid: string, appGuid: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/pp/v1/cf/routes/${this.cnsiGuid}/${routeGuid}/apps/${appGuid}`));
    // Unmapping doesn't delete the route — only the binding. Apps need
    // refetching since route mappings on each app changed.
    this.eds?.applyCascade('route.delete');
  }
}
