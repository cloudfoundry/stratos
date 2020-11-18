import { Observable, of } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { HttpOptions } from '../../../../core/src/core/core.types';
import { environment } from '../../../../core/src/environments/environment';
import { EndpointModel } from '../../../../store/src/public-api';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';


const { proxyAPIVersion } = environment;
const commonPrefix = `/api/${proxyAPIVersion}/proxy`;

export interface GitApiRequest {
  url: string;
  requestArgs: HttpOptions;
}

export abstract class BaseSCM {

  public endpointGuid: string;

  constructor(public publicApiUrl: string) { }

  public getPublicApi(): string {
    return this.publicApiUrl;
  }

  public getAPI(): Observable<GitApiRequest> {
    return this.getEndpoint(this.endpointGuid).pipe(
      map(endpoint => {
        if (!endpoint || !endpoint.user) {
          return {
            url: this.getPublicApi(),
            requestArgs: {}
          };
        }
        return {
          url: `${commonPrefix}/${endpoint.guid}`,
          requestArgs: {
            ... new HttpOptions(),
            header: {
              'x-cap-passthrough': 'true',
            }
          }
        };
      }),
      first()
    );
  }

  protected getEndpoint(endpointGuid: string): Observable<EndpointModel> {
    return endpointGuid ?
      stratosEntityCatalog.endpoint.store.getEntityService(endpointGuid).waitForEntity$.pipe(
        map(e => e.entity)
      ) :
      of(null);
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
