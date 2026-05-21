import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { StOrg } from './stratos-types';

// V3 organization write body. Mirrors capi.OrganizationCreateRequest /
// OrganizationUpdateRequest: {name?, suspended?, metadata?}. Quota
// assignment is a separate relationships endpoint — see
// QuotaDataService.applyOrgQuotaToOrgs.
export interface OrgWriteBody {
  name?: string;
  suspended?: boolean;
  metadata?: { labels?: Record<string, string>; annotations?: Record<string, string> };
}

// Singleton signal-native helper for org create + update. Reads of org
// detail/list state still go through OrgDataService / OrgDataRegistry —
// this surface is intentionally narrow to "write a new org" / "rename
// an org" without dragging in the per-org registry machinery.
@Injectable({ providedIn: 'root' })
export class OrgWriteService {
  private http = inject(HttpClient);

  createOrg(cnsiGuid: string, body: OrgWriteBody): Observable<StOrg> {
    return this.http.post<StOrg>(`/pp/v1/cf/orgs/${cnsiGuid}`, body);
  }

  updateOrg(cnsiGuid: string, orgGuid: string, body: OrgWriteBody): Observable<StOrg> {
    return this.http.patch<StOrg>(`/pp/v1/cf/orgs/${cnsiGuid}/${orgGuid}`, body);
  }
}
