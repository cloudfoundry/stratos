import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { StOrg } from '../endpoint-data/stratos-types';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

// Thin mutation surface for orgs. Org list state lives on
// EndpointDataService._orgs (the per-CNSI cache), not in a CnsiEntitySource
// subclass, because orgs are read by multiple unrelated pages (org list,
// org-space label service, summary cards) all sourced from one cache. This
// class is mutation-only — it issues the HTTP call, waits for the CF v3
// async job to terminate, patches EndpointDataService's local cache, and
// fires the cascade marker so cross-entity slices (spaces / apps / SI /
// bindings) get refetched the next time they're read.
//
// NOTE: org *delete* no longer lives here — it routes through
// EntityDeleteController (see CfOrgsSignalConfigService.deleteOrg) so the
// invalidation set is derived from the relation graph (and the cold/fallback
// path is covered). create/update stay here until Increment 2 fans the rest
// of the entities through the controller.
export class CnsiOrgsSource {
  constructor(
    readonly cnsiGuid: string,
    private readonly http: HttpClient,
    private readonly eds: EndpointDataService,
  ) {}

  async create(payload: unknown): Promise<StOrg> {
    const created = await firstValueFrom(
      this.http.post<StOrg>(`/pp/v1/cf/orgs/${this.cnsiGuid}`, payload),
    );
    this.eds.addOrg(created);
    this.eds.applyCascade('org.create');
    return created;
  }

  async update(orgGuid: string, patch: Partial<StOrg> & Record<string, unknown>): Promise<StOrg> {
    const updated = await firstValueFrom(
      this.http.patch<StOrg>(`/pp/v1/cf/orgs/${this.cnsiGuid}/${orgGuid}`, patch),
    );
    this.eds.updateOrg(orgGuid, updated);
    this.eds.applyCascade('org.update');
    return updated;
  }
}
