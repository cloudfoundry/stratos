import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { IUserProvidedServiceInstanceData } from '../../actions/user-provided-service.actions';
import { StServiceInstance } from '../../services/endpoint-data/stratos-types';

export interface UpsCreateResult {
  success: boolean;
  guid?: string;
  message?: string;
}

export interface UpsUpdateResult {
  success: boolean;
  message?: string;
}

interface PagedServiceInstances {
  resources: StServiceInstance[];
  totalResults?: number;
  pagination?: { totalResults?: number };
}

const totalOf = (resp: PagedServiceInstances): number =>
  resp.pagination?.totalResults ?? resp.totalResults ?? resp.resources.length;

/**
 * CloudFoundryUserProvidedServicesService — UPS read/write surface for the
 * services-domain signal+V3 slice.
 *
 * Reads (Stage 9e):
 *   getUserProvidedServices         — list UPS in a space (or cnsi-wide)
 *   getUserProvidedService          — single UPS by guid
 *   fetchUserProvidedServiceInstancesCount — UPS count scoped to cnsi/org/space
 *
 * Each read hits a Stratos-shape `/pp/v1/cf/...service_instances` endpoint
 * with the v3 `?type=user-provided` filter pushed down to CF v3 by Jetstream.
 * Counts use `?return=counts` (per_page=1 + flat envelope on the wire), lists
 * use `?return=summary&per_page=5000` so consumers receive name + space ref +
 * (for managed instances) plan/offering/broker chains in one round trip.
 *
 * Writes (Stage 5 — kept):
 *   createUserProvidedService       — POST /pp/v1/cf/user_provided_service_instances/{cnsi}
 *   updateUserProvidedService       — PATCH /pp/v1/cf/user_provided_service_instances/{cnsi}/{guid}
 *
 * No ngrx state is read or written by this service. The legacy
 * `clearServiceInstancePagination` dispatch is gone — once the service-instance
 * list views are themselves migrated off the legacy paginators (Stage 9f
 * sweep), there's no paginated cache to invalidate. UPS create/update edits
 * propagate to other views by reloading those views' own signals.
 */
@Injectable({
  providedIn: 'root'
})
export class CloudFoundryUserProvidedServicesService {
  private http = inject(HttpClient);

  /**
   * Lists UPS instances for a CF endpoint, optionally narrowed to a single
   * space. Wire path:
   *
   *   space-scoped: GET /pp/v1/cf/spaces/{cnsi}/{spaceGuid}/service_instances
   *                       ?return=summary&type=user-provided&per_page=5000
   *   cnsi-wide:    GET /pp/v1/cf/service_instances/{cnsi}
   *                       ?return=summary&type=user-provided&per_page=5000
   *
   * `summary` tier resolves space + (managed) plan/offering/broker chains
   * via the v3 ?include= block in one call. The picker uses `name` + `guid`;
   * UPS-only filter ensures managed instances don't pollute the list.
   *
   * 5000 covers most CFs in one page; CFs with > 5000 UPS in a single space
   * are pathological and will be revisited if observed.
   */
  public getUserProvidedServices(cfGuid: string, spaceGuid?: string): Observable<StServiceInstance[]> {
    const path = spaceGuid
      ? `/pp/v1/cf/spaces/${cfGuid}/${spaceGuid}/service_instances`
      : `/pp/v1/cf/service_instances/${cfGuid}`;
    const params = new HttpParams()
      .set('return', 'summary')
      .set('type', 'user-provided')
      .set('per_page', '5000');
    return this.http.get<PagedServiceInstances>(path, { params }).pipe(
      map(resp => (resp.resources || []).map(si => ({ ...si, cnsiGuid: cfGuid }))),
    );
  }

  /**
   * UPS count scoped to a CF endpoint, optionally narrowed by org and/or
   * space. Wire path uses `?return=counts` so the upstream CF v3 call is a
   * cheap per_page=1 round trip — only `pagination.total_results` matters.
   *
   * Filter precedence on the cnsi-wide handler: type + (organization_guids?)
   * + (space_guids?). All three layer onto the same /v3/service_instances
   * call. When only spaceGuid is provided, the path-scoped variant
   * /pp/v1/cf/spaces/{cnsi}/{space}/service_instances is preferred so the
   * space scope rides as a path filter rather than a query — same wire
   * outcome, slightly cleaner URL.
   *
   * Errors surface as 0 rather than propagating to the org/space card. The
   * card needs a number to render and an error in this single tile must
   * not blank out the rest of the card; the error path is observable via
   * the browser network tab. Matches the soft-fail semantics of the
   * EndpointDataService loadServicesCounts() siblings.
   */
  public fetchUserProvidedServiceInstancesCount(
    cfGuid: string,
    orgGuid?: string,
    spaceGuid?: string,
  ): Observable<number> {
    let params = new HttpParams()
      .set('return', 'counts')
      .set('type', 'user-provided');
    let path: string;
    if (spaceGuid && !orgGuid) {
      // Pure space scope — use the path-scoped variant.
      path = `/pp/v1/cf/spaces/${cfGuid}/${spaceGuid}/service_instances`;
    } else {
      path = `/pp/v1/cf/service_instances/${cfGuid}`;
      if (orgGuid) {
        params = params.set('organization_guids', orgGuid);
      }
      if (spaceGuid) {
        params = params.set('space_guids', spaceGuid);
      }
    }
    // shareReplay so multiple template async-pipes on the same field share
    // one HTTP fan-out. Without it, space-detail Summary fires this count
    // probe ~3-5× per page nav (detailsLoading$ combineLatest + the
    // template's @if condition + value display), with the early teardown
    // showing up as ERR_ABORTED in DevTools. refCount:false keeps the
    // cached emission warm across mid-stream resubscribes — matches the
    // dedup pattern in EndpointDataService.load() / OrgDataService.load().
    return this.http.get<PagedServiceInstances>(path, { params }).pipe(
      map(resp => totalOf(resp)),
      catchError(() => of(0)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /**
   * Single UPS by guid — used by the UPS edit-mode pre-fill in the Add
   * Service Instance flow. Wire path:
   *
   *   GET /pp/v1/cf/service_instances/{cnsi}/{upsGuid}?return=summary
   *
   * Summary tier carries the syslogDrainUrl/routeServiceUrl/tags/credentials-
   * absent fields the edit form needs to populate without a follow-up call.
   */
  public getUserProvidedService(cfGuid: string, upsGuid: string): Observable<StServiceInstance> {
    const params = new HttpParams().set('return', 'summary');
    return this.http.get<StServiceInstance>(
      `/pp/v1/cf/service_instances/${cfGuid}/${upsGuid}`,
      { params },
    ).pipe(
      map(si => ({ ...si, cnsiGuid: cfGuid })),
    );
  }

  public createUserProvidedService(
    cfGuid: string,
    _guid: string,
    data: IUserProvidedServiceInstanceData
  ): Observable<UpsCreateResult> {
    return this.http.post<{ guid: string }>(
      `/pp/v1/cf/user_provided_service_instances/${cfGuid}`,
      this.toV3RequestBody(data),
    ).pipe(
      map(res => ({ success: true, guid: res.guid } as UpsCreateResult)),
      catchError((err: HttpErrorResponse) => of<UpsCreateResult>({
        success: false,
        message: this.extractErrorMessage(err),
      })),
    );
  }

  updateUserProvidedService(
    cfGuid: string,
    guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
  ): Observable<UpsUpdateResult> {
    return this.http.patch<{ guid: string }>(
      `/pp/v1/cf/user_provided_service_instances/${cfGuid}/${guid}`,
      this.toV3RequestBody(data),
    ).pipe(
      map(() => ({ success: true } as UpsUpdateResult)),
      catchError((err: HttpErrorResponse) => of<UpsUpdateResult>({
        success: false,
        message: this.extractErrorMessage(err),
      })),
    );
  }

  private toV3RequestBody(data: Partial<IUserProvidedServiceInstanceData>): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) {
      body.name = data.name;
    }
    if (data.spaceGuid !== undefined) {
      body.spaceGuid = data.spaceGuid;
    }
    if (data.tags !== undefined) {
      body.tags = data.tags;
    }
    if (data.credentials !== undefined) {
      body.credentials = data.credentials;
    }
    if (data.syslog_drain_url !== undefined) {
      body.syslogDrainUrl = data.syslog_drain_url;
    }
    if (data.route_service_url !== undefined) {
      body.routeServiceUrl = data.route_service_url;
    }
    return body;
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.message === 'string') {
      return body.message;
    }
    return err.message || `HTTP ${err.status}`;
  }
}
