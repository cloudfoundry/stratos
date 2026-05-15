import { effect, EffectRef, Injector, runInInjectionContext } from '@angular/core';
import { EndpointsDataService, EndpointModel, EntityMonitorFactory, PaginationMonitor } from '@stratosui/store';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';

/**
 * Wave 5 (W36-B): Per-row busy tracking for the endpoints list.
 *
 * Replaces the legacy `entityMonitor.entityRequest$` plumbing on the
 * deleted endpoints request slice. Watches per-guid disconnect lifecycle
 * signals on EndpointsDataService and pushes row state updates.
 */
export function EndpointRowStateSetUpManager(
  paginationMonitor: PaginationMonitor<EndpointModel>,
  _entityMonitorFactory: EntityMonitorFactory,
  rowStateManager: TableRowStateManager,
  endpointsService?: EndpointsDataService,
  injector?: Injector,
): Subscription {
  const composite = new Subscription();
  if (!endpointsService || !injector) {
    composite.add(paginationMonitor.currentPage$.subscribe());
    return composite;
  }
  const effects = new Map<string, EffectRef>();
  const sub = paginationMonitor.currentPage$.pipe(distinctUntilChanged()).subscribe(entities => {
    // Drop watchers for endpoints no longer on the page.
    const liveGuids = new Set(entities.map(e => e.guid));
    for (const guid of Array.from(effects.keys())) {
      if (!liveGuids.has(guid)) {
        effects.get(guid)?.destroy();
        effects.delete(guid);
      }
    }
    // Add watchers for new endpoints.
    for (const entity of entities) {
      if (effects.has(entity.guid)) {
        continue;
      }
      const ref = runInInjectionContext(injector, () =>
        effect(() => {
          const disconnect = endpointsService.disconnectingState(entity.guid)();
          const busy = !!disconnect.busy;
          rowStateManager.updateRowState(entity.guid, { blocked: false, busy });
        })
      );
      effects.set(entity.guid, ref);
    }
  });
  composite.add(sub);
  composite.add(() => {
    for (const ref of effects.values()) {
      ref.destroy();
    }
    effects.clear();
  });
  return composite;
}
