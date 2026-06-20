import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface IdentityProvider {
  originKey: string;
  type: string;
  name: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class CfIdentityProvidersService {
  private http = inject(HttpClient);

  listProviders(cfGuid: string): Observable<IdentityProvider[]> {
    return this.http.get<IdentityProvider[]>(`/pp/v1/cf/identity-providers/${cfGuid}`).pipe(
      catchError(() => of([] as IdentityProvider[])),
    );
  }

  listOrigins(cfGuid: string): Observable<string[]> {
    return this.listProviders(cfGuid).pipe(map(ps => ps.map(p => p.originKey)));
  }
}
