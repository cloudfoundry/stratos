import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UserFavorite } from '../../../store/src/types/user-favorites.types';
import { kubeEntityCatalog } from './kubernetes-entity-generator';

// Namespace favorites validation (getIsValid) must probe existence off the
// signal-native KubeNamespaceDataService read path (the cnsi-scoped jetstream
// proxy), not the removed ngrx entity pipeline. Present in the list => valid,
// absent or fetch error => the namespace was deleted.
describe('kube namespace getIsValid existence probe', () => {
  let httpMock: HttpTestingController;

  const KUBE_GUID = 'kube-1';
  const NS_URL = '/pp/v1/proxy/api/v1/namespaces?limit=500';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideZonelessChangeDetection()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const probe = (name: string) => {
    const getIsValid = kubeEntityCatalog.namespace.builders.entityBuilder?.getIsValid;
    expect(getIsValid).toBeTruthy();
    const favorite = { endpointId: KUBE_GUID, metadata: { name } } as unknown as UserFavorite;
    return firstValueFrom(TestBed.runInInjectionContext(() => getIsValid!(favorite)));
  };

  it('emits true when the namespace is present in the cluster list', async () => {
    const result = probe('ns-a');
    httpMock.expectOne(NS_URL).flush({ [KUBE_GUID]: { items: [{ metadata: { name: 'ns-a' } }] } });
    expect(await result).toBe(true);
  });

  it('emits false when the namespace is absent from the cluster list', async () => {
    const result = probe('ns-gone');
    httpMock.expectOne(NS_URL).flush({ [KUBE_GUID]: { items: [{ metadata: { name: 'ns-a' } }] } });
    expect(await result).toBe(false);
  });

  it('emits false when the namespace fetch errors', async () => {
    const result = probe('ns-a');
    httpMock.expectOne(NS_URL).error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    expect(await result).toBe(false);
  });
});
