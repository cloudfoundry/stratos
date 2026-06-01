import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';
import type { StServiceCredentialBinding } from '../endpoint-data/stratos-types';

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

  // NOTE: binding delete routes through EntityDeleteController (see
  // CfAppsSignalConfigService.deleteServiceBinding + the detach-service-instance
  // stepper); create stays here.
}
