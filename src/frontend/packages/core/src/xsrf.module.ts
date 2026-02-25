import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
  HttpXsrfTokenExtractor,
} from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const STRATOS_XSRF_HEADER_NAME = 'X-XSRF-Token';

/**
 * `HttpXsrfTokenExtractor` which retrieves the token from a cookie.
 */
@Injectable({
  providedIn: 'root'
})
export class HttpXsrfHeaderExtractor implements HttpXsrfTokenExtractor {

  // XSRF Token
  public static stratosXSRFToken = '';

  private platform = inject<string>(PLATFORM_ID);

  getToken(): string | null {
    if (this.platform === 'server') {
      return null;
    }
    return HttpXsrfHeaderExtractor.stratosXSRFToken;
  }
}

/**
 * Functional interceptor to look for the xsrf token in responses
 */
export const xsrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    tap((ev: HttpEvent<unknown>) => {
      if (ev instanceof HttpResponse) {
        // Look for the XSRF-Token Header
        if (ev.headers.has(STRATOS_XSRF_HEADER_NAME)) {
          HttpXsrfHeaderExtractor.stratosXSRFToken = ev.headers.get(STRATOS_XSRF_HEADER_NAME);
        }
      }
    })
  );
};
