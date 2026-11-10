import { Injectable, inject } from '@angular/core';

import { APP_GUID, CF_GUID } from '@stratosui/core';

/**
 * The application a detail page is about, from the route tokens.
 *
 * The Observable facade over AppDetailDataService that lived here is gone:
 * every page and card reads the data service's signals directly.
 *
 * Component-scoped at application-base.component (matches the data
 * service's lifetime). Was providedIn: 'root' historically; that was
 * an injection-token bug — APP_GUID/CF_GUID come from the route.
 */
@Injectable()
export class ApplicationService {
  cfGuid = inject(CF_GUID);
  appGuid = inject(APP_GUID);
}
