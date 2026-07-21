import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Signal-native data service for isolation-segment writes. Same "thin helper"
// convention as QuotaDataService — no per-tuple caching, each call fires a new
// request. Only the bulk-entitle write is wired today; reads live wherever the
// (not-yet-built) isolation-segment list/detail surface lands.
//
// NOTE: there is currently no isolation-segment list/detail page in the
// cloud-foundry package (only the *_guid fields on org/space in
// cf-api.types.ts). This service + the entitle dialog are the entry point a
// future host page opens; until that page exists the affordance is unhosted.
@Injectable({ providedIn: 'root' })
export class IsolationSegmentDataService {
  private http = inject(HttpClient);

  // Bulk-entitle one isolation segment to N organizations in a single call.
  // Wraps the backend POST
  // /cf/isolation_segments/:cnsi/:iso/relationships/organizations, which
  // passes the guids straight to CF V3 POST
  // /v3/isolation_segments/{guid}/relationships/organizations. Body is the
  // shared decodeBulkGUIDs shape { guids: [...] } — NOT the V3
  // { data: [{ guid }] } envelope (the backend builds that from the flat list).
  entitleOrgsToIsoSegment(cnsiGuid: string, isoGuid: string, orgGuids: string[]): Observable<unknown> {
    return this.http.post(
      `/pp/v1/cf/isolation_segments/${cnsiGuid}/${isoGuid}/relationships/organizations`,
      { guids: orgGuids },
    );
  }
}
