import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  StServiceBroker,
  StServiceOffering,
  StServicePlan,
  StServicePlanVisibility,
} from './stratos-types';
import { legacyToStServicePlan } from './services-legacy-adapters';

interface PagedResp<T> {
  resources: T[];
  pagination?: { totalResults?: number };
}

// Signal-native data service for the V3-native catalog detail surface.
// Each method hits exactly one Jetstream native endpoint — bounded, no
// auto-drain. Replaces the marketplace's legacy ngrx pagination web for
// service offerings, plans, brokers, and plan visibility.
//
// Returns Observable rather than Signal so consumers can compose via
// rxjs operators or wrap with toSignal at component boundaries.
@Injectable({ providedIn: 'root' })
export class ServiceCatalogDataService {
  private http = inject(HttpClient);

  serviceOffering(cnsiGuid: string, offeringGuid: string): Observable<StServiceOffering | null> {
    return this.http.get<StServiceOffering>(
      `/pp/v1/cf/service_offerings/${cnsiGuid}/${offeringGuid}`,
    ).pipe(this.catchAs404Null());
  }

  servicePlansForOffering(cnsiGuid: string, offeringGuid: string): Observable<StServicePlan[]> {
    const params = new HttpParams().set('service_offering', offeringGuid);
    return this.http.get<PagedResp<any>>(
      `/pp/v1/cf/service_plans/${cnsiGuid}`,
      { params },
    ).pipe(map(resp => (resp?.resources ?? []).map(r => legacyToStServicePlan(r))));
  }

  serviceBroker(cnsiGuid: string, brokerGuid: string): Observable<StServiceBroker | null> {
    return this.http.get<StServiceBroker>(
      `/pp/v1/cf/service_brokers/${cnsiGuid}/${brokerGuid}`,
      { params: new HttpParams().set('return', 'details') },
    ).pipe(this.catchAs404Null());
  }

  planVisibility(cnsiGuid: string, planGuid: string): Observable<StServicePlanVisibility> {
    return this.http.get<StServicePlanVisibility>(
      `/pp/v1/cf/service_plans/${cnsiGuid}/${planGuid}/visibility`,
    );
  }

  private markBrokerUnavailable(resp: StServiceBroker): StServiceBroker {
    if (!resp) {
      return resp;
    }
    const existing = resp._meta?.unavailable ?? [];
    if (existing.includes('authUsername')) {
      return resp;
    }
    return {
      ...resp,
      _meta: {
        ...resp._meta,
        unavailable: [...existing, 'authUsername'],
      },
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
