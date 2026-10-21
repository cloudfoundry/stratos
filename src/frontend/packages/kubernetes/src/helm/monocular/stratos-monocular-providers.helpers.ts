import { HttpClient, HttpHandler } from '@angular/common/http';

import { MonocularInterceptor } from '../monocular.interceptor';
import { ChartsService } from './shared/services/charts.service';
import { ConfigService } from './shared/services/config.service';
import { MenuService } from './shared/services/menu.service';
import { ReposService } from './shared/services/repos.service';

/**
 * Helm Method to ensure http client with custom monocular interceptor is used in the monocular services
 *
 * The client runs the monocular interceptor (which needs this component's
 * route) and then hands the request to the app's HttpHandler, so the app's
 * own interceptors (XSRF and the rest) still run.
 */
export const createMonocularProviders = () => [
  ChartsService,
  ConfigService,
  MenuService,
  ReposService,
  MonocularInterceptor,
  {
    provide: HttpClient,
    useFactory: (appHandler: HttpHandler, monocularInterceptor: MonocularInterceptor) =>
      new HttpClient({ handle: req => monocularInterceptor.intercept(req, appHandler) }),
    deps: [HttpHandler, MonocularInterceptor]
  }
];
