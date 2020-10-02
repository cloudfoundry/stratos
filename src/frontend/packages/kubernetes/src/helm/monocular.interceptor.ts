import { HttpBackend, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { stratosMonocularEndpointGuid } from './monocular/stratos-monocular.helper';

/**
 * Add information to request to monocular to differ between stratos and helm hub monocular instances
 */
@Injectable()
export class MonocularInterceptor implements HttpInterceptor {

  constructor(private route: ActivatedRoute) { }

  /**
   * The interceptor should only run for http clients provided in the helm module, but just in case only apply self for specific urls..
   */
  private readonly includeUrls = [
    '/pp/v1/chartsvc'
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const validUrl = this.includeUrls.find(part => req.url.indexOf(part) >= 0);
    const endpoint = this.route.snapshot.params.endpoint;
    const hasEndpoint = !!endpoint;
    const isExternalMonocular = endpoint !== stratosMonocularEndpointGuid;

    const newReq = validUrl && hasEndpoint && isExternalMonocular ? req.clone({
      // Endpoint guid will be helm hub's endpoint
      headers: req.headers.set('x-cap-cnsi-list', endpoint)
    }) : req;

    return next.handle(newReq);
  }
}

class HttpInterceptorHandler implements HttpHandler {
  constructor(private next: HttpHandler, private interceptor: HttpInterceptor) { }

  handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    return this.interceptor.intercept(req, this.next);
  }
}
export class HttpInterceptingHandler implements HttpHandler {
  private chain: HttpHandler = null;

  constructor(
    private backend: HttpBackend,
    private interceptors: HttpInterceptor[],
    private intercept?: (req: HttpRequest<any>) => HttpRequest<any>
  ) { }

  handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    if (this.intercept) {
      req = this.intercept(req);
    }

    if (this.chain === null) {
      this.chain = this.interceptors.reduceRight(
        (next, interceptor) => new HttpInterceptorHandler(next, interceptor),
        this.backend
      );
    }
    return this.chain.handle(req);
  }
}
