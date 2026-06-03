import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { InternalEventSeverity } from '../types/internal-events.types';
import { EndpointErrorEventsService } from './endpoint-error-events.service';

// Signal-native replacement for the ngrx internal-events bus. Holds per-endpoint
// error HISTORY (newest first) so the page-header banner + the /errors/:id page
// keep working once the request pipeline (which dispatched SendEventAction) is
// removed. Fed centrally from the signal data layer via recordEndpointErrors,
// which takes a MergeOrchestrator-style errorsByCnsi snapshot.
describe('EndpointErrorEventsService', () => {
  const http500 = (detail = 'boom') =>
    new HttpErrorResponse({ status: 500, statusText: 'Server Error', url: '/pp/v1/cf/x', error: { errors: [{ detail }] } });

  it('records a 5xx error for an endpoint and exposes it newest-first', () => {
    const svc = new EndpointErrorEventsService();
    svc.recordEndpointErrors(new Map([['cnsi-1', http500('first')]]));

    const events = svc.errorsForEndpoint('cnsi-1')();
    expect(events).toHaveLength(1);
    expect(events[0].eventCode).toBe('500');
    expect(events[0].severity).toBe(InternalEventSeverity.ERROR);
    expect(events[0].message).toBe('first');
    expect(typeof events[0].timestamp).toBe('number');
  });

  it('does not duplicate a persistent error across repeated identical snapshots', () => {
    const svc = new EndpointErrorEventsService();
    const err = http500('same');
    svc.recordEndpointErrors(new Map([['cnsi-1', err]]));
    svc.recordEndpointErrors(new Map([['cnsi-1', err]]));

    expect(svc.errorsForEndpoint('cnsi-1')()).toHaveLength(1);
  });

  it('appends a new event when the error changes (history, newest first)', () => {
    const svc = new EndpointErrorEventsService();
    svc.recordEndpointErrors(new Map([['cnsi-1', http500('first')]]));
    svc.recordEndpointErrors(new Map([['cnsi-1', http500('second')]]));

    const events = svc.errorsForEndpoint('cnsi-1')();
    expect(events.map(e => e.message)).toEqual(['second', 'first']);
  });

  it('re-records after the error clears then recurs', () => {
    const svc = new EndpointErrorEventsService();
    svc.recordEndpointErrors(new Map([['cnsi-1', http500('boom')]]));
    svc.recordEndpointErrors(new Map());            // cleared (fetch succeeded)
    svc.recordEndpointErrors(new Map([['cnsi-1', http500('boom')]])); // recurs

    expect(svc.errorsForEndpoint('cnsi-1')()).toHaveLength(2);
  });

  it('clearEndpoint drops that endpoint history', () => {
    const svc = new EndpointErrorEventsService();
    svc.recordEndpointErrors(new Map([['cnsi-1', http500()], ['cnsi-2', http500()]] as [string, unknown][]));
    svc.clearEndpoint('cnsi-1');

    expect(svc.errorsForEndpoint('cnsi-1')()).toHaveLength(0);
    expect(svc.errorsForEndpoint('cnsi-2')()).toHaveLength(1);
  });

  it('keeps history (does not clear) for endpoints absent from a later snapshot', () => {
    const svc = new EndpointErrorEventsService();
    svc.recordEndpointErrors(new Map([['cnsi-1', http500()]]));
    svc.recordEndpointErrors(new Map());

    // History persists until explicitly dismissed — matches the old bus,
    // which kept events until CLEAR_ENDPOINT_ERROR_EVENTS.
    expect(svc.errorsForEndpoint('cnsi-1')()).toHaveLength(1);
  });
});
