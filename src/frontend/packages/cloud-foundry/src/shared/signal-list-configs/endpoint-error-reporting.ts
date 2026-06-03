import { EffectRef, Injector, Signal, effect } from '@angular/core';
import { EndpointErrorEventsService } from '@stratosui/store';

/**
 * Centralised wiring for surfacing signal-data-layer endpoint errors into the
 * signal-native error bus (`EndpointErrorEventsService`), which drives both the
 * page-header error banner and the `/errors/:endpointId` detail page.
 *
 * Every orchestrator-backed list page (apps, service-instances, service-
 * offerings) calls this after building its `MergeOrchestrator`, passing the
 * orchestrator's `errorsByCnsi` signal. Replaces the old per-page habit of
 * reading errors off the ngrx internal-events store and keeps coverage
 * consistent — a new orchestrator page wires error reporting the same one way.
 *
 * Returns the EffectRef so the caller can `destroy()` it before re-wiring on a
 * fresh `initialize()` (the orchestrator instance is rebuilt each time, so the
 * effect must track the new instance's signal).
 */
export function wireEndpointErrorReporting(
  errorsByCnsi: Signal<ReadonlyMap<string, unknown>>,
  service: EndpointErrorEventsService,
  injector: Injector,
): EffectRef {
  return effect(() => service.recordEndpointErrors(errorsByCnsi()), { injector });
}
