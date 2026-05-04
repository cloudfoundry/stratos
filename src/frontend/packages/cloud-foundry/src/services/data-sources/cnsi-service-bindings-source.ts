import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';

export interface StServiceBinding { guid: string; cnsiGuid?: string; }

export class CnsiServiceBindingsSource extends CnsiEntitySource<StServiceBinding> {
  protected readonly entityName = 'service_bindings';

  async create(payload: unknown): Promise<StServiceBinding> {
    return firstValueFrom(this.http.post<StServiceBinding>(`/pp/v1/cf/service_bindings/${this.cnsiGuid}`, payload));
  }

  async delete(bindingGuid: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/pp/v1/cf/service_bindings/${this.cnsiGuid}/${bindingGuid}`));
  }
}
