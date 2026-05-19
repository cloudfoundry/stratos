import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { StOrgQuota, StSpaceQuota } from './stratos-types';

interface PagedResp<T> {
  resources: T[];
  pagination?: { totalResults?: number };
}

export interface SignalSource<T> {
  value: Signal<T>;
  isLoading: Signal<boolean>;
  error: Signal<HttpErrorResponse | null>;
}

// CF V3 org-quota write body. Mirrors the Go capi.OrganizationQuota{Create,Update}
// shape: nested apps/services/routes/domains with `null` = "Unlimited".
export interface OrgQuotaWriteBody {
  name?: string;
  apps?: {
    total_memory_in_mb?: number | null;
    total_instance_memory_in_mb?: number | null;
    total_instances?: number | null;
    total_app_tasks?: number | null;
  };
  services?: {
    paid_services_allowed?: boolean;
    total_service_instances?: number | null;
    total_service_keys?: number | null;
  };
  routes?: {
    total_routes?: number | null;
    total_reserved_ports?: number | null;
  };
  domains?: {
    total_domains?: number | null;
  };
}

// CF V3 space-quota write body. Same shape as org-quota minus `domains`;
// CREATE additionally requires `relationships.organization.data.guid`.
export interface SpaceQuotaWriteBody {
  name?: string;
  apps?: OrgQuotaWriteBody['apps'];
  services?: OrgQuotaWriteBody['services'];
  routes?: OrgQuotaWriteBody['routes'];
  relationships?: {
    organization: { data: { guid: string } };
    spaces?: { data: { guid: string }[] };
  };
}

// Signal-native data service for org + space quotas. Reads return
// SignalSource<T>; writes return cold Observables that emit once the
// HTTP response lands (callers `firstValueFrom` to await).
//
// Same "thin helper" convention as ServiceCatalogDataService — no
// per-tuple caching, no shared instances; each call fires a new request.
@Injectable({ providedIn: 'root' })
export class QuotaDataService {
  private http = inject(HttpClient);

  orgQuotas(cnsiGuid: string): SignalSource<StOrgQuota[]> {
    return this.signalize(
      this.http.get<PagedResp<StOrgQuota>>(
        `/pp/v1/cf/organization_quotas/${cnsiGuid}`,
      ).pipe(map(resp => resp?.resources ?? [])),
      [],
    );
  }

  orgQuota(cnsiGuid: string, quotaGuid: string): SignalSource<StOrgQuota | null> {
    return this.signalize(
      this.http.get<StOrgQuota>(
        `/pp/v1/cf/organization_quotas/${cnsiGuid}/${quotaGuid}`,
      ).pipe(this.catchAs404Null()),
      null,
    );
  }

  spaceQuotas(cnsiGuid: string): SignalSource<StSpaceQuota[]> {
    return this.signalize(
      this.http.get<PagedResp<StSpaceQuota>>(
        `/pp/v1/cf/space_quotas/${cnsiGuid}`,
      ).pipe(map(resp => resp?.resources ?? [])),
      [],
    );
  }

  // Filters the cf-wide space-quotas list to those belonging to a given
  // org. CF V3 doesn't expose an organization-scoped index on
  // /v3/space_quotas, so the backend handler returns all and we narrow
  // client-side. Foundations carry tens of space-quotas typically.
  spaceQuotasInOrg(cnsiGuid: string, orgGuid: string): SignalSource<StSpaceQuota[]> {
    return this.signalize(
      this.http.get<PagedResp<StSpaceQuota>>(
        `/pp/v1/cf/space_quotas/${cnsiGuid}`,
      ).pipe(map(resp => (resp?.resources ?? []).filter(q => q.organizationGuid === orgGuid))),
      [],
    );
  }

  spaceQuota(cnsiGuid: string, quotaGuid: string): SignalSource<StSpaceQuota | null> {
    return this.signalize(
      this.http.get<StSpaceQuota>(
        `/pp/v1/cf/space_quotas/${cnsiGuid}/${quotaGuid}`,
      ).pipe(this.catchAs404Null()),
      null,
    );
  }

  createOrgQuota(cnsiGuid: string, body: OrgQuotaWriteBody): Observable<StOrgQuota> {
    return this.http.post<StOrgQuota>(`/pp/v1/cf/organization_quotas/${cnsiGuid}`, body);
  }

  updateOrgQuota(cnsiGuid: string, quotaGuid: string, body: OrgQuotaWriteBody): Observable<StOrgQuota> {
    return this.http.patch<StOrgQuota>(`/pp/v1/cf/organization_quotas/${cnsiGuid}/${quotaGuid}`, body);
  }

  createSpaceQuota(cnsiGuid: string, body: SpaceQuotaWriteBody): Observable<StSpaceQuota> {
    return this.http.post<StSpaceQuota>(`/pp/v1/cf/space_quotas/${cnsiGuid}`, body);
  }

  updateSpaceQuota(cnsiGuid: string, quotaGuid: string, body: SpaceQuotaWriteBody): Observable<StSpaceQuota> {
    return this.http.patch<StSpaceQuota>(`/pp/v1/cf/space_quotas/${cnsiGuid}/${quotaGuid}`, body);
  }

  // Apply an org quota to one or more orgs. Used by the create/edit-org
  // step components to set the quota after creating/updating the org;
  // V3 splits the quota assignment off into a relationships endpoint
  // rather than carrying it on the org write body.
  applyOrgQuotaToOrgs(cnsiGuid: string, quotaGuid: string, orgGuids: string[]): Observable<unknown> {
    return this.http.post(
      `/pp/v1/cf/organization_quotas/${cnsiGuid}/${quotaGuid}/relationships/organizations`,
      { data: orgGuids.map(guid => ({ guid })) },
    );
  }

  private signalize<T>(obs: Observable<T>, initial: T): SignalSource<T> {
    const value = signal<T>(initial);
    const isLoading = signal(true);
    const error = signal<HttpErrorResponse | null>(null);
    obs.subscribe({
      next: v => {
        value.set(v);
        isLoading.set(false);
      },
      error: e => {
        error.set(e);
        isLoading.set(false);
      },
    });
    return {
      value: value.asReadonly(),
      isLoading: isLoading.asReadonly(),
      error: error.asReadonly(),
    };
  }

  private catchAs404Null<T>() {
    return catchError<T, Observable<T | null>>((err: HttpErrorResponse) => {
      if (err.status === 404) {
        return of(null);
      }
      return throwError(() => err);
    });
  }
}
