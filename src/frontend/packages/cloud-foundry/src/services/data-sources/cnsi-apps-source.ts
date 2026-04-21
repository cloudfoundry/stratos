import { firstValueFrom } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';
import type { StApp } from '../endpoint-data/stratos-types';

export class CnsiAppsSource extends CnsiEntitySource<StApp> {
  protected readonly entityName = 'apps';

  async delete(appGuid: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}`));
    this.patchItems(items => items.filter(a => (a as { guid?: string }).guid !== appGuid));
  }
}
