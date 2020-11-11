import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { getFullEndpointApiUrl } from '../../../../store/src/endpoint-utils';
import { EndpointModel } from '../../../../store/src/public-api';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';

export abstract class BaseSCM {

  public endpointGuid: string;

  protected getAPIUrl(): Observable<string> {
    if (!this.endpointGuid) {
      return null;
    }
    return this.getEndpoint(this.endpointGuid).pipe(
      map(getFullEndpointApiUrl),
      tap(url => { console.log('getAPIUrl: ', url); })
    );
  }

  protected getEndpoint(endpointGuid: string): Observable<EndpointModel> {
    return stratosEntityCatalog.endpoint.store.getEntityService(endpointGuid).waitForEntity$.pipe(
      map(e => e.entity)
    );
  }

  protected parseErrorAsString(res: any): string {
    const response = this.parseHttpPipeError(res);
    return response.message || '';
  }

  private parseHttpPipeError(res: any): { message?: string; } {
    if (!res.status) {
      return res;
    }
    try {
      return res.json ? res.json() : res;
    } catch (e) {
      console.warn('Failed to parse response body', e);
    }
    return {};
  }
}