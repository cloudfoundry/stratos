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

  planVisibility(cnsiGuid: string, planGuid: string): SignalSource<StServicePlanVisibility | null> {
    return this.signalize(
      this.http.get<StServicePlanVisibility>(
        `/pp/v1/cf/service_plans/${cnsiGuid}/${planGuid}/visibility`,
      ),
      null,
    );
  }

  serviceInstance(cnsiGuid: string, instanceGuid: string): SignalSource<StServiceInstance | null> {
    return this.signalize(
      this.http.get<StServiceInstance>(
        `/pp/v1/cf/service_instances/${cnsiGuid}/${instanceGuid}`,
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
