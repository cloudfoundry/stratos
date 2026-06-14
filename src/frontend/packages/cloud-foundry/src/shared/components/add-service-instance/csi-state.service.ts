import { Injectable, Signal, computed, signal } from '@angular/core';

/**
 * Cross-step state for the Add Service Instance / Bind / Edit flow.
 *
 * Replaces the legacy ngrx `createServiceInstance` slice (actions +
 * reducer + selectors) with a signal-driven state container scoped to
 * the AddServiceInstanceComponent's provider tree. Children read state
 * via signals (or computed projections) and mutate via the imperative
 * setters that mirror the legacy action contracts one-for-one.
 *
 * Scope: provided in the AddServiceInstanceComponent providers array
 * so each stepper instantiation gets its own state. Lifecycle ends
 * with the component (no manual cleanup needed beyond the component's
 * existing reset on destroy).
 */
export interface CsiState {
  name: string;
  // Cleared back to null by the legacy reducer contract (setServiceGuid
  // blanks the plan; setCFDetails / resetOrgAndSpace clear org & space).
  servicePlanGuid: string | null;
  spaceGuid: string | null;
  orgGuid: string | null;
  parameters?: string;
  tags?: string[];
  bindAppGuid?: string | null;
  bindAppParams?: object;
  serviceInstanceGuid?: string | null;
  spaceScoped: boolean;
  cfGuid?: string;
  serviceGuid?: string | null;
}

const defaultState: CsiState = {
  name: '',
  servicePlanGuid: '',
  spaceGuid: '',
  orgGuid: '',
  spaceScoped: false,
};

@Injectable()
export class CsiStateService {
  private readonly _state = signal<CsiState>({ ...defaultState });

  readonly state: Signal<CsiState> = this._state.asReadonly();

  readonly cfGuid = computed(() => this._state().cfGuid);
  readonly orgGuid = computed(() => this._state().orgGuid);
  readonly spaceGuid = computed(() => this._state().spaceGuid);
  readonly servicePlanGuid = computed(() => this._state().servicePlanGuid);
  readonly serviceGuid = computed(() => this._state().serviceGuid);
  readonly serviceInstanceGuid = computed(() => this._state().serviceInstanceGuid);
  readonly spaceScoped = computed(() => this._state().spaceScoped);

  setCFDetails(cfGuid: string, orgGuid: string | null = null, spaceGuid: string | null = null): void {
    this._state.update(s => ({ ...s, cfGuid, orgGuid, spaceGuid }));
  }

  setSpaceScoped(spaceScoped: boolean, spaceGuid: string | null = null): void {
    this._state.update(s => ({ ...s, spaceScoped, spaceGuid }));
  }

  setOrg(orgGuid: string): void {
    this._state.update(s => ({ ...s, orgGuid }));
  }

  setSpace(spaceGuid: string): void {
    this._state.update(s => ({ ...s, spaceGuid }));
  }

  setServiceGuid(serviceGuid: string | null = null): void {
    // Mirror the legacy reducer: changing service blanks the plan.
    this._state.update(s => ({ ...s, serviceGuid, servicePlanGuid: null }));
  }

  setServicePlan(servicePlanGuid: string): void {
    this._state.update(s => ({ ...s, servicePlanGuid }));
  }

  setServiceInstanceGuid(serviceInstanceGuid: string): void {
    this._state.update(s => ({ ...s, serviceInstanceGuid }));
  }

  setApp(bindAppGuid: string | null, params: Record<string, unknown>): void {
    this._state.update(s => ({ ...s, bindAppGuid, bindAppParams: params }));
  }

  setAll(
    name: string,
    spaceGuid: string,
    tags: string[],
    parameters: string,
    spaceScoped = false,
    serviceInstanceGuid: string | null = null,
  ): void {
    this._state.update(s => ({
      ...s,
      name,
      spaceGuid,
      tags,
      parameters,
      spaceScoped,
      serviceInstanceGuid,
    }));
  }

  reset(): void {
    this._state.set({ ...defaultState });
  }

  resetOrgAndSpace(): void {
    this._state.update(s => ({ ...s, orgGuid: null, spaceGuid: null }));
  }
}
