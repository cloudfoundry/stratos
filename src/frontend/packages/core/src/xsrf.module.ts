import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpXsrfTokenExtractor,
} from '@angular/common/http';
import { Inject, Injectable, NgModule, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Request, XSRFStrategy, RequestMethod } from '@angular/http';

const STRATOS_XSRF_HEADER_NAME = 'X-XSRF-Token';

@Injectable()
export class HttpXsrfHeaderExtractor implements HttpXsrfTokenExtractor {

  // XSRF Token
  public static stratosXSRFToken = '';

  constructor(@Inject(PLATFORM_ID) private platform: string) { }

  getToken(): string | null {
    if (this.platform === 'server') {
      return null;
    }
    return HttpXsrfHeaderExtractor.stratosXSRFToken;
  }
}

// Interceptor to look for the xsrf token in responses
// Only works for calls using the new HttpClient in @angular/common/http
@Injectable()
export class HttpXsrfHeaderInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap((ev: HttpEvent<any>) => {
        if (ev instanceof HttpResponse) {
          // Look for the XSRF-Token Header
          if (ev.headers.has(STRATOS_XSRF_HEADER_NAME)) {
            HttpXsrfHeaderExtractor.stratosXSRFToken = ev.headers.get(STRATOS_XSRF_HEADER_NAME);
          }
        }
      })
    );
  }
}

// XSRF Stragety for legacy http library calls
@Injectable()
export class StratosHeaderXSRFStrategy implements XSRFStrategy {
  constructor() {}

  configureRequest(req: Request): void {
    if (req.method !== RequestMethod.Get && req.method !== RequestMethod.Head && HttpXsrfHeaderExtractor.stratosXSRFToken) {
      req.headers.set(STRATOS_XSRF_HEADER_NAME, HttpXsrfHeaderExtractor.stratosXSRFToken);
    }
  }
}

@NgModule({
  providers: [
    { provide: HttpXsrfTokenExtractor, useClass: HttpXsrfHeaderExtractor },
    [{
      provide: HTTP_INTERCEPTORS,
      useClass: HttpXsrfHeaderInterceptor,
      multi: true,
    }],
    { provide: XSRFStrategy, useClass: StratosHeaderXSRFStrategy },
  ],
})
export class XSRFModule { }
