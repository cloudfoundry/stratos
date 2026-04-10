import { HTTP_INTERCEPTORS, HttpBackend, HttpClient, HttpInterceptor } from '@angular/common/http';
import { Optional } from '@angular/core';

import { HttpInterceptingHandler, MonocularInterceptor } from '../monocular.interceptor';
import { ChartsService } from './shared/services/charts.service';
import { ConfigService } from './shared/services/config.service';
import { MenuService } from './shared/services/menu.service';
import { ReposService } from './shared/services/repos.service';

/**
 * Helm Method to ensure http client with custom monocular interceptor is used in the monocular services
 *
 * HTTP_INTERCEPTORS is Optional because the app uses functional interceptors
 * (provideHttpClient withInterceptors) rather than the legacy DI-based multi
 * provider. When no class-based interceptors are registered, HTTP_INTERCEPTORS
 * resolves to null and we fall back to an empty array.
 */
export const createMonocularProviders = () => [
  ChartsService,
  ConfigService,
  MenuService,
  ReposService,
  MonocularInterceptor,
  {
    provide: HttpClient,
    useFactory: (httpBackend: HttpBackend, interceptors: HttpInterceptor[] | null, monocularInterceptor: MonocularInterceptor) => {
      return new HttpClient(new HttpInterceptingHandler(httpBackend, [
        ...(interceptors || []),
        monocularInterceptor
      ]));
    },
    deps: [HttpBackend, [new Optional(), HTTP_INTERCEPTORS], MonocularInterceptor]
  }
];
