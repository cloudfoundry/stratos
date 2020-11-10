import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getFullEndpointApiUrl } from '../../../../store/src/endpoint-utils';
import { EndpointModel } from '../../../../store/src/public-api';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';

export abstract class BaseSCM {

  private pEndpointGuid: string;
  setEndpointGuid(endpointGuid: string) {
    this.pEndpointGuid = endpointGuid;
  }
  getEndpointGuid(endpointGuid: string): string {
    return endpointGuid || this.pEndpointGuid;
  }

  protected getAPIUrl(endpointGuid: string): Observable<string> {
    const guid = endpointGuid || this.pEndpointGuid;
    if (!guid) {
      return null;
    }
    return this.getEndpoint(guid).pipe(
      map(getFullEndpointApiUrl)
    );
  }

  protected getEndpoint(endpointGuid: string): Observable<EndpointModel> {
    return stratosEntityCatalog.endpoint.store.getEntityService(endpointGuid).waitForEntity$.pipe(
      map(e => e.entity)
    );
  }
}