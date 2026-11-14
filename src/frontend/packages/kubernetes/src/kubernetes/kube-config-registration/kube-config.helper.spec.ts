import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { RowState } from '../../../../core/src/shared/components/signal-list/row-state.types';
import { KubeConfigHelper } from './kube-config.helper';
import { KubeConfigFileCluster } from './kube-config.types';

// Returns the cluster's current row state. parse() stores a signal wrapper
// in _state; a plain Subject keeps no current value, so this throws if it
// finds one.
const rowState = (cluster: KubeConfigFileCluster): RowState => {
  const state = cluster._state;
  if (!('getValue' in state)) {
    throw new Error('expected _state to be a signal wrapper');
  }
  return state.getValue();
};

// A minimal kubeconfig with one cluster/user/context pair. parse() runs
// checkValidity() from outside any injection context, which is exactly how
// the file-input handler calls it in the wizard (NG0203 regression cover).
const kubeConfigYaml = (name: string, server: string) => `
apiVersion: v1
kind: Config
current-context: ${name}
clusters:
- name: ${name}
  cluster:
    server: ${server}
contexts:
- name: ${name}
  context:
    cluster: ${name}
    user: admin@${name}
users:
- name: admin@${name}
  user:
    client-certificate-data: Y2VydA==
    client-key-data: a2V5
`;

const endpoint = (name: string, host: string) => ({
  name,
  guid: `guid-${name}`,
  api_endpoint: { Scheme: 'https', Host: host, Path: '' },
});

describe('KubeConfigHelper', () => {
  let helper: KubeConfigHelper;

  const setup = (endpoints: object[]) => {
    TestBed.configureTestingModule({
      providers: [
        KubeConfigHelper,
        { provide: EndpointsService, useValue: { endpoints: signal(Object.fromEntries(endpoints.map((e, i) => [i, e]))) } },
      ],
    });
    helper = TestBed.inject(KubeConfigHelper);
    helper.clustersChanged = () => { /* noop */ };
  };

  it('parses a config and marks the cluster valid when nothing conflicts', () => {
    setup([]);
    helper.parse(kubeConfigYaml('fresh', 'https://1.2.3.4:6443')).subscribe();
    expect(helper.clusters()!.length).toBe(1);
    expect(helper.clusters()![0]._invalid).toBeFalsy();
  });

  it('warns but does not block when the URL is already registered under a different name', () => {
    setup([endpoint('other-name', '1.2.3.4:6443')]);
    helper.parse(kubeConfigYaml('fresh', 'https://1.2.3.4:6443')).subscribe();
    expect(helper.clusters()![0]._invalid).toBeFalsy();
    expect(rowState(helper.clusters()![0]).message).toBe('Another endpoint is already registered at this URL — importing will register this as an additional endpoint.');
    expect(rowState(helper.clusters()![0]).warning).toBe(true);
  });

  it('treats an address written differently as the same URL', () => {
    setup([endpoint('other-name', 'K8S.example.com:6443')]);
    helper.parse(kubeConfigYaml('fresh', 'https://k8s.example.com:6443/')).subscribe();
    expect(rowState(helper.clusters()![0]).warning).toBe(true);
  });

  it('marks connect-only when the address is written differently', () => {
    setup([endpoint('fresh', 'K8S.example.com:6443')]);
    helper.parse(kubeConfigYaml('fresh', 'https://k8s.example.com:6443/')).subscribe();
    expect(helper.clusters()![0]._guid).toBe('guid-fresh');
  });

  it('marks connect-only when name and URL match an existing endpoint', () => {
    setup([endpoint('fresh', '1.2.3.4:6443')]);
    helper.parse(kubeConfigYaml('fresh', 'https://1.2.3.4:6443')).subscribe();
    expect(helper.clusters()![0]._invalid).toBeFalsy();
    expect(helper.clusters()![0]._guid).toBe('guid-fresh');
    expect(rowState(helper.clusters()![0]).info).toBe(true);
  });

  it('clears connect-only when the cluster is renamed away from the collision', () => {
    setup([endpoint('fresh', '1.2.3.4:6443')]);
    helper.parse(kubeConfigYaml('fresh', 'https://1.2.3.4:6443')).subscribe();
    expect(helper.clusters()![0]._guid).toBe('guid-fresh');
    helper.clusters()![0].name = 'fresh-2';
    helper.update(helper.clusters()![0]);
    expect(helper.clusters()![0]._guid).toBe('');
    expect(helper.clusters()![0]._invalid).toBeFalsy();
    expect(rowState(helper.clusters()![0]).message).toBe('Another endpoint is already registered at this URL — importing will register this as an additional endpoint.');
  });

  it('blocks when the name is taken by an endpoint with a different URL', () => {
    setup([endpoint('fresh', '5.6.7.8:6443')]);
    helper.parse(kubeConfigYaml('fresh', 'https://1.2.3.4:6443')).subscribe();
    expect(helper.clusters()![0]._invalid).toBe(true);
    expect(rowState(helper.clusters()![0]).message).toBe('An endpoint with this name already exists');
  });

  // The selection step reads the clusters when told they changed, so they
  // must be set by then.
  it('has the new clusters in place when it announces the change', () => {
    setup([]);
    let seen: KubeConfigFileCluster[] | null | undefined;
    helper.clustersChanged = () => seen = helper.clusters();
    expect(helper.clusters()).toBeNull();

    helper.parse(kubeConfigYaml('fresh', 'https://1.2.3.4:6443')).subscribe();

    expect(seen?.map(c => c.name)).toEqual(['fresh']);
  });

  it('checks every cluster again and announces the change', () => {
    setup([]);
    helper.parse(kubeConfigYaml('fresh', 'https://1.2.3.4:6443')).subscribe();
    const changed = vi.fn();
    helper.clustersChanged = changed;
    helper.clusters()![0].name = '';

    helper.updateAll();

    expect(helper.clusters()![0]._invalid).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
  });
});
