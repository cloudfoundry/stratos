import { Injectable } from '@angular/core';

/**
 * Empty shell of the former Observable-shaped session-config facade. The
 * session flags are signals on {@link SessionSignalService}; read them
 * there. Only kept for the endpoint registration helper's constructor,
 * which the Git registration form still passes it through.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {}
