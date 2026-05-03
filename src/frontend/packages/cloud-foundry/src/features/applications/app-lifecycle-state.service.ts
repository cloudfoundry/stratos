import { Injectable, signal, Signal, WritableSignal } from '@angular/core';

/**
 * AppLifecycleStateService — minimal shared-state service holding the
 * "is a write operation in flight" flag.
 *
 * Exists to break the construction cycle between AppDetailDataService
 * (which polls faster while writes are in flight) and
 * AppApplicationActionsService (which orchestrates the writes and used to
 * own this flag itself). Both services now depend on this leaf service
 * instead of each other.
 *
 * Component-scoped at application-base.component to match the lifetime of
 * the app-detail subtree.
 */
@Injectable()
export class AppLifecycleStateService {
  private readonly _inFlight: WritableSignal<boolean> = signal(false);
  readonly inFlight: Signal<boolean> = this._inFlight.asReadonly();

  setInFlight(value: boolean): void {
    this._inFlight.set(value);
  }
}
