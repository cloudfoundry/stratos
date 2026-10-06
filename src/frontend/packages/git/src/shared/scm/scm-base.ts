import { Observable, of } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { Injector } from '@angular/core';

import { HttpOptions } from '../../../../core/src/core/core.types';
import { environment } from '../../../../core/src/environments/environment';
import { EndpointModel } from '../../../../store/src/public-api';
import { EndpointsDataService } from '../../../../store/src/services/endpoints-data.service';


const { proxyAPIVersion } = environment;
const commonPrefix = `/api/${proxyAPIVersion}/proxy`;

export interface GitApiRequest {
  url: string;
  requestArgs: HttpOptions;
}

export abstract class BaseSCM {

  // strict: assigned by every concrete subclass constructor (GitHubSCM,
  // GitLabSCM) immediately after super().
  public endpointGuid!: string;

  // W36-B Wave 3: optional EndpointsDataService + Injector. When set
  // (via the GitSCMService factory) the getEndpoint() bridge reads
  // from the signal-native service instead of the legacy ngrx
  // pagination monitor. Subclasses surface these through their
  // constructors.
  protected endpointsData?: EndpointsDataService;
  protected injector?: Injector;

  constructor(public publicApiUrl: string) { }

  public setPublicApi(url: string) {
    this.publicApiUrl = url;
  }

  public getPublicApi(): string {
    return this.publicApiUrl;
  }

  public getAPI(options: HttpOptions = new HttpOptions()): Observable<GitApiRequest> {
    return this.getEndpoint(this.endpointGuid).pipe(
      map(endpoint => {
        if (!endpoint) {
          // No endpoint, use the default or overwritten public api associated with this type
          return {
            url: this.getPublicApi(),
            requestArgs: options
          };
        }
        // We have an endpoint so always proxy via backend
        return {
          url: `${commonPrefix}/${endpoint.guid}`,
          requestArgs: {
            ...options,
            headers: {
              'x-cap-no-token': `${!endpoint.user}`
            }
          }
        };
      }),
      take(1)
    );
  }

  protected getEndpoint(endpointGuid: string): Observable<EndpointModel | undefined> {
    if (!endpointGuid) {
      return of(undefined);
    }
    // W36-B Wave 3: source endpoints from EndpointsDataService when
    // available. Same lookup semantics as the legacy
    // pagination-monitor read — find by guid in the current map and
    // tolerate misses (e.g. an app deployed from a since-deleted
    // private github endpoint). The signal-native projection updates
    // synchronously, so the take(1) consumer pattern downstream is
    // unchanged.
    if (!this.endpointsData || !this.injector) {
      throw new Error('BaseSCM requires EndpointsDataService + Injector — supply them via the subclass constructor.');
    }
    return toObservable(this.endpointsData.endpointsList, { injector: this.injector }).pipe(
      map(endpoints => endpoints?.find(e => e.guid === endpointGuid))
    );
  }

  // A request the browser never completed (status 0) to a host other than the
  // console's own: most often the Content-Security-Policy refusing it, which
  // the app cannot tell apart from the network being down. Names the host and
  // the two ways to allow it. Same-origin failures (the backend proxy) return
  // undefined so the caller keeps its own message.
  protected unreachableHostMessage(error: unknown): string | undefined {
    const { status, url } = (error ?? {}) as { status?: number; url?: string | null };
    if (status !== 0 || !url) {
      return undefined;
    }
    const origin = new URL(url, window.location.href).origin;
    if (origin === window.location.origin) {
      return undefined;
    }
    return `Could not reach ${origin}. If the console blocks it, ask your administrator to add ${origin} to ` +
      'CONSOLE_CSP_GIT_HOSTS, or to register it as a Git endpoint.';
  }

  protected parseErrorAsString(res: unknown): string {
    const response = this.parseHttpPipeError(res);
    return response.message || '';
  }

  private parseHttpPipeError(res: unknown): { message?: string; } {
    if (typeof res !== 'object' || res === null) {
      return {};
    }

    const response = res as { status?: number; json?: () => unknown; message?: string };

    if (!response.status) {
      return response;
    }
    try {
      return response.json ? response.json() as { message?: string } : response;
    } catch (e) {
      console.warn('Failed to parse response body', e);
    }
    return {};
  }
}
