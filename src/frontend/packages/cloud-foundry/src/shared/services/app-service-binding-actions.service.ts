import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { ApplicationService } from '../../features/applications/application.service';
import { EntityDeleteController } from '../../services/deletes/entity-delete.controller';
import { runCfDelete } from '../../services/deletes/run-cf-delete';
import { serviceCredentialBindingEntityType } from '../../entity-relations/signal/cf-relation-registrations';

/**
 * AppServiceBindingActionsService
 *
 * Per-binding verbs (unbind) for the app-detail Service Bindings tab.
 * Sibling to AppRouteActionsService — same lifetime contract: tab-scoped,
 * single in-flight verb at a time, transitioning-guid signal for per-row
 * UI gating.
 *
 * Wires:
 *   unbind: DELETE /pp/v1/cf/service_bindings/{cnsi}/{bindingGuid}
 *           — V3 returns 202 + job (handler `deleteNativeServiceBinding`);
 *           routed through writeWithJob with settling poll.
 *
 * Cache eviction is the consumer's responsibility: on success the tab
 * calls `dataService.removeServiceBinding(guid)` so the row vanishes
 * synchronously without re-fetch. Action service stays focused on the
 * verb call + transition signalling.
 *
 * Edit is NOT exposed here — the legacy "edit binding" flow is actually
 * navigation to the existing AddServiceInstanceComponent in edit mode
 * (`/services/:type/:cnsi/:siGuid/edit`). That nav stays in the
 * consuming component, same as add-route in the Routes tab.
 */
@Injectable()
export class AppServiceBindingActionsService {
  private http = inject(HttpClient);
  private applicationService = inject(ApplicationService);
  private deleteController = inject(EntityDeleteController);

  /** GUID of the binding currently being unbound; null when idle. */
  private readonly _transitioningBindingGuid = signal<string | null>(null);
  readonly transitioningBindingGuid = this._transitioningBindingGuid.asReadonly();

  /** True while an unbind verb is in flight. */
  readonly inFlight = computed(() => this._transitioningBindingGuid() !== null);

  /**
   * Unbind a service from the current app. CF V3 returns 202 + job; the
   * Promise resolves only when the job settles (COMPLETE) or rejects on
   * FAILED. transitioningBindingGuid stays set across the full settling
   * window so the per-row spinner holds until the binding is truly gone.
   *
   * Reentrancy: rejects if another verb is already in flight.
   */
  async unbindService(bindingGuid: string): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another binding action is already in flight');
    }
    const { cfGuid } = this.applicationService;
    this._transitioningBindingGuid.set(bindingGuid);
    try {
      // Route through the chokepoint so the binding delete also invalidates
      // the EDS cache + reverse-edge slices (bound app/SI rollups) and fires
      // cleanup hooks — the tab still evicts its own row via removeServiceBinding.
      await runCfDelete(this.deleteController, this.http, {
        cnsiGuid: cfGuid,
        entityKind: serviceCredentialBindingEntityType,
        deleteGuid: bindingGuid,
        path: `/pp/v1/cf/service_bindings/${cfGuid}/${bindingGuid}`,
      });
    } finally {
      this._transitioningBindingGuid.set(null);
    }
  }
}
