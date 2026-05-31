import { HttpClient } from '@angular/common/http';
import { KubeGenericResourceConfig, KubeGenericResourceDataServiceBase } from './kube-generic-resource-data.base';

class TestResourceService extends KubeGenericResourceDataServiceBase<{ metadata: { name: string } }> {
  protected readonly http = {} as HttpClient;
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1', resourceName: 'tests', namespaced: true, title: 'tests',
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
