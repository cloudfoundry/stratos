import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  StServiceBroker,
  StServiceCredentialBinding,
  StServiceCredentialBindingsResponse,
  StServiceInstance,
  StServiceInstancesResponse,
  StServiceOffering,
  StServicePlan,
  StServicePlanVisibility,
} from './stratos-types';

interface PagedResp<T> {
  resources: T[];
  pagination?: { totalResults?: number };
}

// A route's route-service binding (a route binds to 0-or-1 service instance).
// Mapped from the raw v3 service_route_binding resource.
export interface RouteServiceBindingView {
  guid: string;
  serviceInstanceGuid: string;
  routeServiceUrl?: string;
  lastOperationState?: string;
}

interface RawRouteServiceBinding {
  guid: string;
  route_service_url?: string;
  last_operation?: { state?: string };
  relationships?: { service_instance?: { data?: { guid?: string } } };
}

interface RawRouteServiceBindingsResponse {
  resources?: RawRouteServiceBinding[];
}

function toRouteServiceBindingView(raw: RawRouteServiceBinding): RouteServiceBindingView {
  return {
    guid: raw.guid,
    serviceInstanceGuid: raw.relationships?.service_instance?.data?.guid ?? '',
    routeServiceUrl: raw.route_service_url,
    lastOperationState: raw.last_operation?.state,
  };
}

// Service keys come back from GH#4301's native handler as raw v3
// service_credential_binding resources (type=key). We only render a few
// fields, so map to this view model rather than the full St shape.
export interface ServiceKeyView {
  guid: string;
  name: string;
  createdAt: string;
  lastOperationState?: string;
}

interface RawServiceKey {
  guid: string;
  name?: string;
  created_at?: string;
  last_operation?: { state?: string };
}

interface RawServiceKeysResponse {
  resources?: RawServiceKey[];
}

function toServiceKeyView(raw: RawServiceKey): ServiceKeyView {
  return {
    guid: raw.guid,
    name: raw.name ?? '',
    createdAt: raw.created_at ?? '',
    lastOperationState: raw.last_operation?.state,
  };
}

// Per-call loadable signal triple — value + lifecycle signals so
// consumers with loading-state machinery (e.g. cf-service-plans-signal
// -config) can wire UI states without re-implementing the pieces.
// Consumers that just want the value read `.value`; ones that also
// care about progress or failure read `.isLoading` / `.error`.
export interface SignalSource<T> {
  value: Signal<T>;
  isLoading: Signal<boolean>;
  error: Signal<HttpErrorResponse | null>;
}

// Signal-native data service for the V3-native catalog detail surface.
// Each method hits exactly one Jetstream native endpoint — bounded, no
// auto-drain. Returns a SignalSource<T> (value/isLoading/error) that
// flips once the HTTP response lands.
//
// The "thin helper" shape: no per-tuple caching, no shared instance
// across consumers. Each method call fires a new request and returns
// a fresh triple. If you need cross-consumer caching or in-flight
// dedup, lift the call into a registry-backed per-entity data service
// (see OrgDataService / OrgDataRegistry for the convention).
@Injectable({ providedIn: 'root' })
export class ServiceCatalogDataService {
  private http = inject(HttpClient);

  serviceOffering(cnsiGuid: string, offeringGuid: string): SignalSource<StServiceOffering | null> {
    // ?return=details so the Summary card has the offering's
    // description, tags, available, shareable, documentationUrl, and
    // broker.url. Without it the handler defaults to ReturnBase which
    // omits everything except guid + name, leaving "Available: No",
    // "Shareable: No", empty Tags, empty description on the summary tab.
    return this.signalize(
      this.http.get<StServiceOffering>(
        `/pp/v1/cf/service_offerings/${cnsiGuid}/${offeringGuid}`,
        { params: new HttpParams().set('return', 'details') },
      ).pipe(this.catchAs404Null()),
      null,
    );
  }

  // Lists service offerings filtered to those reachable from a given
  // space. Backs the add-service-instance wizard's Select Service step.
  // Backend forwards `?space_guids=` to /v3/service_offerings.
  serviceOfferingsInSpace(cnsiGuid: string, spaceGuid: string): SignalSource<StServiceOffering[]> {
    const params = new HttpParams()
      .set('space_guids', spaceGuid)
      .set('return', 'summary');
    return this.signalize(
      this.http.get<PagedResp<StServiceOffering>>(
        `/pp/v1/cf/service_offerings/${cnsiGuid}`,
        { params },
      ).pipe(map(resp => resp?.resources ?? [])),
      [],
    );
  }

  servicePlansForOffering(cnsiGuid: string, offeringGuid: string): SignalSource<StServicePlan[]> {
    const params = new HttpParams()
      .set('service_offering', offeringGuid)
      .set('return', 'summary');
    return this.signalize(
      this.http.get<PagedResp<StServicePlan>>(
        `/pp/v1/cf/service_plans/${cnsiGuid}`,
        { params },
      ).pipe(map(resp => resp?.resources ?? [])),
      [],
    );
  }

  serviceBroker(cnsiGuid: string, brokerGuid: string): SignalSource<StServiceBroker | null> {
    return this.signalize(
      this.http.get<StServiceBroker>(
        `/pp/v1/cf/service_brokers/${cnsiGuid}/${brokerGuid}`,
        { params: new HttpParams().set('return', 'details') },
      ).pipe(this.catchAs404Null()),
      null,
    );
  }

  // Single plan at details tier. The services-domain list caches are
  // summary-tier, and plan `schemas` only ship at details — so the
  // create/edit-service-instance parameter step fetches the selected
  // plan here or its schema-driven form silently degrades to the raw
  // JSON textbox.
  servicePlan(cnsiGuid: string, planGuid: string): SignalSource<StServicePlan | null> {
    return this.signalize(
      this.http.get<StServicePlan>(
        `/pp/v1/cf/service_plans/${cnsiGuid}/${planGuid}`,
        { params: new HttpParams().set('return', 'details') },
      ).pipe(this.catchAs404Null()),
      null,
    );
  }

  planVisibility(cnsiGuid: string, planGuid: string): SignalSource<StServicePlanVisibility | null> {
    return this.signalize(
      this.http.get<StServicePlanVisibility>(
        `/pp/v1/cf/service_plans/${cnsiGuid}/${planGuid}/visibility`,
      ),
      null,
    );
  }

  // Writes one plan's visibility scope via the native apply handler
  // (Jetstream: applyNativeServicePlanVisibility). The backend request
  // body is `{ type, organizations }` where `organizations` is a flat
  // list of org guids — so `type=organization` with N guids applies the
  // plan to N orgs in a single call. POST replaces the existing scope;
  // PATCH merges onto it (both map to the same body shape). `orgGuids` is
  // only meaningful for `type=organization`; the other types send it
  // empty and the backend ignores it.
  applyPlanVisibility(
    cnsiGuid: string,
    planGuid: string,
    type: string,
    orgGuids: string[] = [],
    mode: 'replace' | 'merge' = 'replace',
  ): SignalSource<StServicePlanVisibility | null> {
    const url = `/pp/v1/cf/service_plans/${cnsiGuid}/${planGuid}/visibility`;
    const body = { type, organizations: orgGuids };
    const req = mode === 'merge'
      ? this.http.patch<StServicePlanVisibility>(url, body)
      : this.http.post<StServicePlanVisibility>(url, body);
    return this.signalize(req, null);
  }

  // `?return=summary` so the backend resolves the
  // servicePlan → serviceOffering chain on the SI envelope. Base mode
  // returns only relationship guids, leaving `servicePlan.serviceOffering`
  // empty — and the add-service-instance edit flow reads
  // `si.servicePlan.serviceOffering.guid` to derive the offering guid for
  // the wizard's service step.
  serviceInstance(cnsiGuid: string, instanceGuid: string): SignalSource<StServiceInstance | null> {
    const params = new HttpParams().set('return', 'summary');
    return this.signalize(
      this.http.get<StServiceInstance>(
        `/pp/v1/cf/service_instances/${cnsiGuid}/${instanceGuid}`,
        { params },
      ).pipe(this.catchAs404Null()),
      null,
    );
  }

  // Bindings attached to a single service instance. ?return=summary so
  // each row carries the bound app's name (via v3 ?include=app on the
  // CAPI list), which the table-cell renderer reads to label the app
  // chips. Same backend route the detach-apps modal will consume.
  serviceBindingsForInstance(cnsiGuid: string, instanceGuid: string): SignalSource<StServiceCredentialBinding[]> {
    const params = new HttpParams().set('return', 'summary');
    return this.signalize(
      this.http.get<StServiceCredentialBindingsResponse>(
        `/pp/v1/cf/service_instances/${cnsiGuid}/${instanceGuid}/service_bindings`,
        { params },
      ).pipe(map(resp => resp?.resources ?? [])),
      [],
    );
  }

  // Bulk-share one managed service instance with N target spaces in a single
  // call. Wraps the backend POST
  // /cf/service_instances/:cnsi/:si/relationships/shared_spaces, which forwards
  // to CF V3 POST /v3/service_instances/{guid}/relationships/shared_spaces.
  // Body is the shared { guids: [...] } bulk shape (decodeBulkGUIDs on the
  // backend), NOT the V3 { data: [{ guid }] } relationship envelope — the
  // handler rebuilds the envelope. Returns the raw CF shared-spaces
  // relationships response; the share dialog `firstValueFrom`s it.
  shareServiceInstanceWithSpaces(cnsiGuid: string, instanceGuid: string, spaceGuids: string[]): Observable<unknown> {
    return this.http.post(
      `/pp/v1/cf/service_instances/${cnsiGuid}/${instanceGuid}/relationships/shared_spaces`,
      { guids: spaceGuids },
    );
  }

  // Managed-instance parameters — CF v3 GET .../parameters, proxied by the
  // native handler, returning the bare params object the broker was
  // provisioned with. No catchAs404Null: brokers that don't enable
  // instances_retrievable make CF error here, and the section needs to tell
  // "not available" (error) apart from "no parameters" (an empty object), so
  // the failure must surface on `.error` rather than collapse to null. Lazy —
  // the detail page calls this only when the Parameters section is expanded.
  serviceInstanceParameters(cnsiGuid: string, instanceGuid: string): SignalSource<Record<string, unknown> | null> {
    return this.signalize(
      this.http.get<Record<string, unknown>>(
        `/pp/v1/cf/service_instances/${cnsiGuid}/${instanceGuid}/parameters`,
      ),
      null,
    );
  }

  // User-provided instance credentials — CF v3 GET .../credentials, proxied by
  // the native handler. Sensitive: the caller fetches this only on an explicit
  // reveal action (never on page load) and the UI masks the values by default.
  // UPS-only — CF errors for a managed instance, surfaced via `.error`.
  userProvidedCredentials(cnsiGuid: string, instanceGuid: string): SignalSource<Record<string, unknown> | null> {
    return this.signalize(
      this.http.get<Record<string, unknown>>(
        `/pp/v1/cf/service_instances/${cnsiGuid}/${instanceGuid}/credentials`,
      ),
      null,
    );
  }

  // Service keys for a single instance — credential bindings with type=key
  // (filtered server-side by GH#4301's native handler). Maps the raw v3
  // binding resources to a small view model the keys page renders. The keys
  // management page (and its reload after create/delete) consume this.
  serviceKeysForInstance(cnsiGuid: string, instanceGuid: string): SignalSource<ServiceKeyView[]> {
    const params = new HttpParams().set('service_instance_guids', instanceGuid);
    return this.signalize(
      this.http.get<RawServiceKeysResponse>(
        `/pp/v1/cf/service_keys/${cnsiGuid}`,
        { params },
      ).pipe(map(resp => (resp?.resources ?? []).map(toServiceKeyView))),
      [],
    );
  }

  serviceInstancesInSpace(cnsiGuid: string, spaceGuid: string): SignalSource<StServiceInstance[]> {
    const params = new HttpParams()
      .set('space_guids', spaceGuid)
      .set('return', 'summary');
    return this.signalize(
      this.http.get<StServiceInstancesResponse>(
        `/pp/v1/cf/service_instances/${cnsiGuid}`,
        { params },
      ).pipe(map(resp => resp?.resources ?? [])),
      [],
    );
  }

  // The route-service binding for a single route (0-or-1). Drives the Route
  // Service page; reloaded after bind/unbind by re-invoking this.
  routeServiceBinding(cnsiGuid: string, routeGuid: string): SignalSource<RouteServiceBindingView | null> {
    const params = new HttpParams().set('route_guids', routeGuid);
    return this.signalize(
      this.http.get<RawRouteServiceBindingsResponse>(
        `/pp/v1/cf/service_route_bindings/${cnsiGuid}`,
        { params },
      ).pipe(map(resp => {
        const first = resp?.resources?.[0];
        return first ? toRouteServiceBindingView(first) : null;
      })),
      null,
    );
  }

  // Returns the total count of service instances under a cf, optionally
  // narrowed by org or space. Backend ?return=counts emits a flat envelope
  // with totalResults populated and resources empty.
  serviceInstanceCount(cnsiGuid: string, orgGuid?: string, spaceGuid?: string): SignalSource<number> {
    let params = new HttpParams().set('return', 'counts');
    if (orgGuid) {
      params = params.set('organization_guids', orgGuid);
    }
    if (spaceGuid) {
      params = params.set('space_guids', spaceGuid);
    }
    return this.signalize(
      this.http.get<StServiceInstancesResponse>(
        `/pp/v1/cf/service_instances/${cnsiGuid}`,
        { params },
      ).pipe(map(resp => resp?.totalResults ?? 0)),
      0,
    );
  }

  // Wraps a cold HTTP observable in a SignalSource: value seeded with
  // `initial`, isLoading starts true, error null. Subscribes once,
  // flipping value+isLoading on next and isLoading+error on error.
  // The cold http.get observable completes after one emission, so the
  // subscription self-terminates.
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
