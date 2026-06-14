import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { KubeGenericResourceConfig, KubeGenericResourceDataServiceBase } from './kube-generic-resource-data.base';

class TestResourceService extends KubeGenericResourceDataServiceBase<{ metadata: { name: string } }> {
  protected readonly http = {} as HttpClient;
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1', resourceName: 'tests', namespaced: true, title: 'tests',
  };
}

class DeletableTestService extends KubeGenericResourceDataServiceBase<{ metadata: { name: string; namespace?: string } }> {
  public lastDelete?: { url: string; cnsi: string | null };
  protected readonly http = {
    delete: (url: string, opts: any) => {
      this.lastDelete = { url, cnsi: opts?.headers?.get?.('x-cap-cnsi-list') ?? null };
      return of(null);
    },
  } as unknown as HttpClient;
  protected config: KubeGenericResourceConfig = {
    apiPath: '/api/v1', resourceName: 'secrets', namespaced: true, title: 'secrets',
  };
}

describe('KubeGenericResourceDataServiceBase workload scope', () => {
  it('setWorkloadItems stores items readable via itemsInWorkload, keyed by release', () => {
    const svc = new TestResourceService();
    expect(svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')()).toEqual([]);
    svc.setWorkloadItems('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 'r1' } } as any]);
    const out = svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')();
    expect(out.length).toBe(1);
    expect(out[0].kubeGuid).toBe('cnsi-1');
    expect((out[0].metadata as any).kubeId).toBe('cnsi-1');
    expect(svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-y')()).toEqual([]);
  });
});

describe('KubeGenericResourceDataServiceBase delete', () => {
  it('DELETEs the namespaced resource URL with the cnsi header and drops the row from workload scope', async () => {
    const svc = new DeletableTestService();
    svc.setWorkloadItems('cnsi-1', 'ns-a', 'rel-x', [
      { metadata: { name: 'r1', namespace: 'ns-a' } } as any,
      { metadata: { name: 'r2', namespace: 'ns-a' } } as any,
    ]);

    await svc.delete('cnsi-1', 'r1', 'ns-a');

    expect(svc.lastDelete?.url).toBe('/pp/v1/proxy/api/v1/namespaces/ns-a/secrets/r1');
    expect(svc.lastDelete?.cnsi).toBe('cnsi-1');
    expect(svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')().map(i => i.metadata.name)).toEqual(['r2']);
  });

  it('drops the deleted row from cluster and namespace scopes too', async () => {
    const svc = new DeletableTestService();
    (svc as any)['_clusterItems'].set(new Map([['cnsi-1', [{ metadata: { name: 'r1' }, kubeGuid: 'cnsi-1' }]]]));
    svc.setWorkloadItems('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 'r1', namespace: 'ns-a' } } as any]);
    await svc.delete('cnsi-1', 'r1', 'ns-a');
    expect(svc.itemsInCluster('cnsi-1')()).toEqual([]);
    expect(svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')()).toEqual([]);
  });

  it('uses the cluster URL form when no namespace is given', async () => {
    const svc = new DeletableTestService();
    (svc as any).config = { apiPath: '/api/v1', resourceName: 'persistentvolumes', namespaced: false, title: 'pv' };
    await svc.delete('cnsi-1', 'pv1');
    expect(svc.lastDelete?.url).toBe('/pp/v1/proxy/api/v1/persistentvolumes/pv1');
  });
});
