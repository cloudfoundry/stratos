import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { StSpace } from '../endpoint-data/stratos-types';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

// Thin mutation surface for spaces. Mirrors CnsiOrgsSource — see that
// file for the architectural rationale. Spaces cache lives on
// EndpointDataService._spaces; this class patches it on success and fires
// the cascade marker for downstream slices (apps / SI / bindings).
//
// NOTE: space *delete* routes through EntityDeleteController (see
// CfSpacesSignalConfigService.deleteSpace); create/update stay here.
export class CnsiSpacesSource {
  constructor(
    readonly cnsiGuid: string,
    private readonly http: HttpClient,
    private readonly eds: EndpointDataService,
  ) {}

  async create(payload: unknown): Promise<StSpace> {
    const created = await firstValueFrom(
      this.http.post<StSpace>(`/pp/v1/cf/spaces/${this.cnsiGuid}`, payload),
    );
    this.eds.addSpace(created);
    this.eds.applyCascade('space.create');
    return created;
  }

  async update(spaceGuid: string, patch: Partial<StSpace> & Record<string, unknown>): Promise<StSpace> {
    const updated = await firstValueFrom(
      this.http.patch<StSpace>(`/pp/v1/cf/spaces/${this.cnsiGuid}/${spaceGuid}`, patch),
    );
    this.eds.updateSpace(spaceGuid, updated);
    this.eds.applyCascade('space.update');
    return updated;
  }
}
