import { Injectable, inject } from '@angular/core';

import { StratosError } from '../endpoint-data/kube-types';
import { KubeNamespaceDataService } from './kube-namespace-data.service';
import { KubeNodeDataService } from './kube-node-data.service';
import { KubePodDataService } from './kube-pod-data.service';

// Why an endpoint's cluster-wide node, namespace and pod lists last failed
// to load, for views that show their counts (cluster Summary tab, home
// card): a failed count is not 0. Each method is a reactive read of the
// newest failure's reason, undefined while that list's last load worked.
@Injectable({ providedIn: 'root' })
export class KubeClusterLoadFailures {
  private readonly podData = inject(KubePodDataService);
  private readonly nodeData = inject(KubeNodeDataService);
  private readonly namespaceData = inject(KubeNamespaceDataService);

  nodes(kubeGuid: string): string | undefined {
    return newestReason(this.nodeData.errors()().filter(e => e.affected?.includes(kubeGuid)));
  }

  namespaces(kubeGuid: string): string | undefined {
    return newestReason(this.namespaceData.namespaceListErrors(kubeGuid));
  }

  pods(kubeGuid: string): string | undefined {
    return newestReason(this.podData.scopeErrors({ kubeGuid }));
  }

  // The first failing list's reason, if any failed.
  any(kubeGuid: string): string | undefined {
    return this.nodes(kubeGuid) ?? this.namespaces(kubeGuid) ?? this.pods(kubeGuid);
  }
}

function newestReason(errors: StratosError[]): string | undefined {
  const newest = errors[errors.length - 1];
  return newest ? (newest.detail || newest.title) : undefined;
}
