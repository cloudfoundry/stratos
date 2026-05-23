import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';
import type { StServiceCredentialBinding } from '../endpoint-data/stratos-types';
import { writeWithJob } from '../async-jobs/write-with-job';

export class CnsiServiceBindingsSource extends CnsiEntitySource<StServiceCredentialBinding> {
  protected readonly entityName = 'service_bindings';

  constructor(
    cnsiGuid: string,
    http: HttpClient,
    private readonly eds?: EndpointDataService,
    pageSize: number = 100,
  ) {
    super(cnsiGuid, http, pageSize);
  }

  async create(payload: unknown): Promise<StServiceCredentialBinding> {
    const created = await firstValueFrom(
      this.http.post<StServiceCredentialBinding>(`/pp/v1/cf/service_bindings/${this.cnsiGuid}`, payload),
    );
    this.patchItems(items => [...items, created]);
    this.eds?.addServiceCredentialBinding(created);
    this.eds?.applyCascade('serviceBinding.create');
    return created;
  }

  async delete(bindingGuid: string): Promise<void> {
    const call = this.http.delete(
      `/pp/v1/cf/service_bindings/${this.cnsiGuid}/${bindingGuid}`,
      { observe: 'response' },
    );
    await writeWithJob(this.http, call);
    this.patchItems(items => items.filter(b => b.guid !== bindingGuid));
    this.eds?.removeServiceCredentialBinding(bindingGuid);
    this.eds?.applyCascade('serviceBinding.delete');
  }
}
