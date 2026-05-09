import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';

import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { CreateServiceInstanceHelper } from './create-service-instance-helper.service';

/**
 * Factory for CreateServiceInstanceHelper. Caches helpers by
 * `${cfGuid}-${serviceGuid}` so re-entry into the stepper for the same
 * pair reuses the cache (and the warm EndpointDataService cache it
 * acquires). Wraps construction in runInInjectionContext so the helper
 * can use toObservable() on its derived signals.
 */
@Injectable({
  providedIn: 'root',
})
export class CreateServiceInstanceHelperServiceFactory {
  private readonly injector = inject(Injector);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly cache: { [key: string]: CreateServiceInstanceHelper } = {};

  create(cfGuid: string, serviceGuid: string): CreateServiceInstanceHelper {
    if (!cfGuid) {
      throw new Error('CreateServiceInstanceHelperServiceFactory.create() requires a valid cfGuid');
    }
    if (!serviceGuid) {
      throw new Error('CreateServiceInstanceHelperServiceFactory.create() requires a valid serviceGuid');
    }
    const key = `${cfGuid}-${serviceGuid}`;
    if (!this.cache[key]) {
      this.cache[key] = runInInjectionContext(this.injector, () =>
        new CreateServiceInstanceHelper(serviceGuid, cfGuid, this.registry),
      );
    }
    return this.cache[key];
  }
}
