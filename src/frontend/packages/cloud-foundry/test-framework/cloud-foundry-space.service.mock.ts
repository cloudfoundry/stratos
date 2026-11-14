import { Signal, signal } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';

import { CloudFoundrySpaceService } from '../src/features/cf/services/cloud-foundry-space.service';

export class CloudFoundrySpaceServiceMock {
  cfGuid = 'cf-1';
  orgGuid = 'org-1';
  spaceGuid = 'space-1';
  apps = signal([]);
  appInstances = signal(0);
  totalMem = signal(0);
  loadingApps = signal(false);
  usersCount = signal<number | null>(null);
  userRole = signal<string | null>(null);
  routesCount = signal<number | null>(null);
  serviceInstancesCount = signal(0);
  userProvidedServiceInstancesCount$: Observable<number> = observableOf(0);
  quotaDefinition: Signal<unknown> = signal(null);
  spaceQuotaDefinition: Signal<unknown> = signal(null);
  fetchApps() {}
  // Signal-native shim: card-cf-space-details and other space-detail consumers
  // read scalar fields off cfSpaceService.spaceDataService.space() directly.
  spaceDataService = {
    space: () => null,
    isLoading: () => false,
    errors: () => [],
    load: () => observableOf(undefined),
  };
}

export const getCfSpaceServiceMock = {
  provide: CloudFoundrySpaceService,
  useClass: CloudFoundrySpaceServiceMock
};
