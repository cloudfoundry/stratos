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
    // ?return=details so the Summary card has the offering's
    // description, tags, available, shareable, documentationUrl, and
    // broker.url. Without it the handler defaults to ReturnBase which
    // omits everything except guid + name, leaving "Available: No",
    // "Shareable: No", empty Tags, empty description on the summary tab.
    return this.http.get<StServiceOffering>(
      `/pp/v1/cf/service_offerings/${cnsiGuid}/${offeringGuid}`,
      { params: new HttpParams().set('return', 'details') },
    ).pipe(this.catchAs404Null());
  }

  servicePlansForOffering(cnsiGuid: string, offeringGuid: string): Observable<StServicePlan[]> {
    const params = new HttpParams()
      .set('service_offering', offeringGuid)
      .set('return', 'summary');
    return this.http.get<PagedResp<StServicePlan>>(
      `/pp/v1/cf/service_plans/${cnsiGuid}`,
      { params },
    ).pipe(map(resp => resp?.resources ?? []));
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

  private catchAs404Null<T>() {
    return catchError<T, Observable<T | null>>((err: HttpErrorResponse) => {
      if (err.status === 404) {
        return of(null);
      }
      return throwError(() => err);
    });
  }
}
