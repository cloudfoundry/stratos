import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import type { StServiceInstance } from '../endpoint-data/stratos-types';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';
import { writeWithJob } from '../async-jobs/write-with-job';

// Per-CNSI source for service instances. Reads
// /pp/v1/cf/service_instances/{cnsi}, which now emits the nested-ref
// StServiceInstance shape natively at every ?return= tier (no wire
// adapter needed). The CnsiEntitySource base class walks pagination via
// the v3 envelope's pagination links.
//
// Mutations go through writeWithJob → patchItems → EDS local-cache patch
// → applyCascade. The EDS reference is optional so existing read-only
// construction sites that haven't been threaded yet (e.g. cold bookmarks)
// still work — when omitted, the source still patches its own _items but
// no cross-tab cascade fires; callers should pass EDS once available.
export class CnsiServiceInstancesSource extends CnsiEntitySource<StServiceInstance> {
  protected readonly entityName = 'service_instances';

  constructor(
    cnsiGuid: string,
    http: HttpClient,
    private readonly eds?: EndpointDataService,
    pageSize: number = 100,
  ) {
    super(cnsiGuid, http, pageSize);
  }

  protected adaptResource(raw: unknown, cnsiGuid: string): StServiceInstance {
    return { ...(raw as StServiceInstance), cnsiGuid };
  }

  async create(payload: unknown): Promise<StServiceInstance> {
    const created = await firstValueFrom(
      this.http.post<StServiceInstance>(`/pp/v1/cf/service_instances/${this.cnsiGuid}`, payload),
    );
    this.patchItems(items => [...items, created]);
    this.eds?.addServiceInstance(created);
    this.eds?.applyCascade('serviceInstance.create');
    return created;
  }

  async update(siGuid: string, patch: Partial<StServiceInstance> & Record<string, unknown>): Promise<StServiceInstance> {
    const updated = await firstValueFrom(
      this.http.patch<StServiceInstance>(`/pp/v1/cf/service_instances/${this.cnsiGuid}/${siGuid}`, patch),
    );
    this.patchItems(items => items.map(si => si.guid === siGuid ? { ...si, ...updated } : si));
    this.eds?.updateServiceInstance(siGuid, updated);
    this.eds?.applyCascade('serviceInstance.update');
    return updated;
  }

  async delete(siGuid: string): Promise<void> {
    const call = this.http.delete(
      `/pp/v1/cf/service_instances/${this.cnsiGuid}/${siGuid}`,
      { observe: 'response' },
    );
    await writeWithJob(this.http, call);
    this.patchItems(items => items.filter(si => si.guid !== siGuid));
    this.eds?.removeServiceInstance(siGuid);
    this.eds?.applyCascade('serviceInstance.delete');
  }
}
