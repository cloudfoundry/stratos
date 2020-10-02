import { HTTP_INTERCEPTORS, HttpBackend, HttpClient, HttpInterceptor } from '@angular/common/http';

import { HttpInterceptingHandler, MonocularInterceptor } from '../monocular.interceptor';
import { ChartsService } from './shared/services/charts.service';
import { ConfigService } from './shared/services/config.service';
import { MenuService } from './shared/services/menu.service';
import { ReposService } from './shared/services/repos.service';

/**
 * Helm Method to ensure http client with custom monocular interceptor is used in the monocular services
 */
export const createMonocularProviders = () => [
  ChartsService,
  ConfigService,
  MenuService,
  ReposService,
  MonocularInterceptor,
  {
    provide: HttpClient,
    useFactory: (httpBackend: HttpBackend, interceptors: HttpInterceptor[], monocularInterceptor: MonocularInterceptor) => {
      return new HttpClient(new HttpInterceptingHandler(httpBackend, [
        ...interceptors,
        monocularInterceptor
      ]));
    },
    deps: [HttpBackend, HTTP_INTERCEPTORS, MonocularInterceptor]
  }
];