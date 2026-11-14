import { signal } from '@angular/core';
import { of as observableOf } from 'rxjs';

export class CloudFoundryOrganizationServiceMock {
  // Signal-native shim: card-cf-org-user-details and other org-detail consumers
  // read scalar fields off cfOrgService.orgDataService.org() directly. Returns
  // null so templates render their `?` chains as empty.
  orgDataService = {
    org: () => null,
    spaces: () => [],
    isLoading: () => false,
    errors: () => [],
    load: () => observableOf(undefined),
  };
  userProvidedServiceInstancesCount$ = observableOf(0);
  userOrgRole = signal<string | null>(null);
  quotaLink = signal<string[] | undefined>(undefined);
  quotaDefinition = signal(null);
}
