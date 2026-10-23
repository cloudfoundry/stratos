import { InjectionToken } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Given by the Register Endpoint dialog to the registration form it hosts.
 * The dialog is not a route, so the form closes it through this handle
 * instead of navigating to /endpoints (the page it is already on).
 */
export interface EndpointRegisterHandle {
  /**
   * Close the dialog. `registered`: the form registered an endpoint, so the
   * endpoints page refreshes and says so.
   */
  close(registered: boolean): void;
}

export const ENDPOINT_REGISTER_HANDLE = new InjectionToken<EndpointRegisterHandle>('ENDPOINT_REGISTER_HANDLE');

/**
 * Leave a registration form when it is done: close the Register Endpoint
 * dialog that hosts it, or, on the /endpoints/new page, go to the endpoints
 * list.
 */
export async function leaveEndpointRegistration(
  handle: EndpointRegisterHandle | null,
  router: Router,
  registered: boolean,
): Promise<void> {
  if (handle) {
    handle.close(registered);
    return;
  }
  await router.navigateByUrl('/endpoints');
}
