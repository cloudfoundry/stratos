import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { NewAppCFDetails } from '../../store/types/create-application.types';

export type { NewAppCFDetails };

export interface CreateAppState {
  cloudFoundryDetails: NewAppCFDetails | null;
  name: string;
}

/**
 * Signal-native store for the "create application" wizard's cross-step
 * state (selected cf/org/space + app name). Replaces the global
 * `createApplication` ngrx feature slice.
 *
 * Scoped at the root because the state is shared app-wide: the create
 * wizard steps write it, the edit-application page seeds it, and the
 * app-name-unique directive reads it across both flows — exactly the
 * reach the old global slice had.
 */
@Injectable({ providedIn: 'root' })
export class CreateAppStateService {
  private readonly cfDetails = signal<NewAppCFDetails | null>(null);
  private readonly appName = signal<string>('');

  readonly cloudFoundryDetails = this.cfDetails.asReadonly();
  readonly name = this.appName.asReadonly();

  // Observable mirrors for the remaining rxjs consumers (the create
  // wizard's step3 domains pipeline and the app-name-unique async
  // validator), which still compose with HttpClient streams.
  readonly cloudFoundryDetails$: Observable<NewAppCFDetails | null> = toObservable(this.cfDetails);
  readonly state$: Observable<CreateAppState> = combineLatest([
    this.cloudFoundryDetails$,
    toObservable(this.appName),
  ]).pipe(map(([cloudFoundryDetails, name]) => ({ cloudFoundryDetails, name })));

  setCFDetails(details: NewAppCFDetails): void {
    this.cfDetails.set(details);
  }

  setName(name: string): void {
    this.appName.set(name);
  }

  reset(): void {
    this.cfDetails.set(null);
    this.appName.set('');
  }
}
