import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Signal-native data service for domain writes. Same "thin helper" convention
// as IsolationSegmentDataService / QuotaDataService — no per-tuple caching,
// each call fires a new request. Only the bulk-share write is wired today;
// domain reads flow through the legacy domains.actions.ts NgRx path used by
// the Add Route domain picker.
//
// NOTE: there is currently no domain list/detail management page in the
// cloud-foundry package (domains are only consumed as the Add Route dropdown,
// sourced from applicationService.orgDomains$). This service + the share
// dialog are the entry point a future host surface opens; until that page
// exists the affordance is unhosted — mirroring the isolation-segment
// entitle-orgs pattern.
@Injectable({ providedIn: 'root' })
export class DomainDataService {
  private http = inject(HttpClient);

  // Bulk-share one private domain with N organizations in a single call.
  // Wraps the backend POST
  // /cf/domains/:cnsi/:domain/relationships/shared_organizations, which passes
  // the guids straight to CF V3 POST
  // /v3/domains/{guid}/relationships/shared_organizations. Body is the shared
  // decodeBulkGUIDs shape { guids: [...] } — NOT the V3 { data: [{ guid }] }
  // envelope (the backend builds that from the flat list).
  shareDomainWithOrgs(cnsiGuid: string, domainGuid: string, orgGuids: string[]): Observable<unknown> {
    return this.http.post(
      `/pp/v1/cf/domains/${cnsiGuid}/${domainGuid}/relationships/shared_organizations`,
      { guids: orgGuids },
    );
  }
}
