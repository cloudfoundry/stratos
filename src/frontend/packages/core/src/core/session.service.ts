import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AppState, AuthState, SessionData, SessionDataConfig } from '@stratosui/store';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private store = inject<Store<AppState>>(Store);

  readonly auth: Signal<AuthState | undefined> = toSignal(this.store.select(s => s.auth));

  readonly sessionData: Signal<SessionData | null> = computed(() => this.auth()?.sessionData ?? null);

  readonly config: Signal<SessionDataConfig | null> = computed(() => this.sessionData()?.config ?? null);
}
