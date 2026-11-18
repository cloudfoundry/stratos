import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import {
  EndpointsDataService,
  EndpointModel,
} from '@stratosui/store';
import { SessionService } from '../../../../core/src/core/session.service';
import { BaseKubeGuid } from '../kubernetes-page.types';
import {
  KubernetesNode,
  KubernetesPod,
} from '../store/kube.types';
import { Annotations } from './../store/kube.types';

const CAASP_VERSION_ANNOTATION = 'caasp.suse.com/caasp-release-version';
const CAASP_DISRUPTIVE_UPDATES_ANNOTATION = 'caasp.suse.com/has-disruptive-updates';
const CAASP_SECURITY_UPDATES_ANNOTATION = 'caasp.suse.com/has-security-updates';
const CAASP_HAS_UPDATES_ANNOTATION = 'caasp.suse.com/has-updates';

export interface CaaspNodesData {
  version: string;
  versionMismatch: boolean;
  updates: number;
  disruptiveUpdates: number;
  securityUpdates: number;
}

export interface CaaspNodeData {
  version: string;
  updates: boolean;
  disruptiveUpdates: boolean;
  securityUpdates: boolean;
}

// Locally-defined kubedash status shape — wave-3.5 (slice K-final) deletes
// the legacy `store/kubernetes.effects.ts` location, so the consumer-side
// code holds its own type definition rather than importing from store/.
// Mirrors the jetstream `/pp/v1/kubedash/{guid}/status` payload.
export interface KubeDashboardContainer {
  name: string;
  image: string;
}

export interface KubeDashboardStatus {
  guid: string;
  kubeGuid: string;
  metadata?: {
    kubeId: string;
  };
  installed: boolean;
  stratosInstalled: boolean;
  running: boolean;
  pod: {
    spec: {
      containers: KubeDashboardContainer[];
    };
  };
  version: string;
  service: {
    namespace: string;
    name: string;
    scheme: string;
  };
  serviceAccount: any;
}

// Is the dashboard installed with a service account and a service?
export function kubeDashboardConfigured(status: KubeDashboardStatus | null): boolean {
  return !!(status && status.installed && !!status.serviceAccount && !!status.service);
}

// The dashboard's state as shown on the summary page.
export function kubeDashboardLabel(status: KubeDashboardStatus | null): string {
  if (!status) {
    return '';
  }
  if (!status.installed) {
    return 'Not installed';
  } else if (!status.serviceAccount) {
    return 'Not configured';
  }
  return status.version;
}

@Injectable({
  providedIn: 'root'
})
export class KubernetesEndpointService {
  baseKube = inject(BaseKubeGuid);
  private session = inject(SessionService);
  private http = inject(HttpClient);
  private endpointsService = inject(EndpointsDataService);

  // strict: assigned by initialize() when a kubeGuid exists (the
  // constructor calls it).
  kubeGuid!: string;
  // An HTTP read: stays a stream; the summary page subscribes to it.
  kubeDashboardStatus$!: Observable<KubeDashboardStatus | null>;

  // Signal members. The endpoint is read from the endpoints map, so it
  // follows later updates; it stays undefined without a kubeGuid.
  endpoint: Signal<EndpointModel | undefined> = signal(undefined);
  private readonly pluginConfig = computed(() => this.session.sessionData()?.['plugin-config']);
  readonly kubeDashboardEnabled = computed(() => this.pluginConfig()?.kubeDashboardEnabled === 'true');
  readonly kubeTerminalEnabled = computed(() => this.pluginConfig()?.kubeTerminalEnabled === 'true');

  public static getKubeDashboardStatus(http: HttpClient, session: SessionService, kubeGuid: string): Observable<KubeDashboardStatus | null> {
    const pluginConfig = session.sessionData()?.['plugin-config'];
    const enabled = pluginConfig?.kubeDashboardEnabled === 'true';
    if (!enabled) {
      return of(null);
    }
    return http.get<KubeDashboardStatus>(`/pp/v1/kubedash/${kubeGuid}/status`).pipe(
      catchError(() => of(null)),
    );
  }

  constructor() {
    const baseKube = this.baseKube;

    const kubeGuid = baseKube.guid;

    if (kubeGuid) {
      this.initialize(kubeGuid);
    }
  }

  initialize(kubeGuid: string): void {
    this.kubeGuid = kubeGuid;

    this.constructCoreObservables();
  }

  getCaaspNodesData(nodes: KubernetesNode[]): CaaspNodesData | null {
    const info: CaaspNodesData = {
      version: 'Unknown',
      versionMismatch: false,
      updates: 0,
      disruptiveUpdates: 0,
      securityUpdates: 0
    };
    const versions: Record<string, number> = {};

    nodes.forEach(n => {
      const nodeData = this.getCaaspNodeData(n);
      if (!nodeData) {
        return;
      }

      // Only has a version if it is a CaaSP node
      if (nodeData.version) {
        if (!versions[nodeData.version]) {
          versions[nodeData.version] = 0;
        }
        versions[nodeData.version]++;
      }

      info.updates += nodeData.updates ? 1 : 0;
      info.disruptiveUpdates += nodeData.disruptiveUpdates ? 1 : 0;
      info.securityUpdates += nodeData.securityUpdates ? 1 : 0;
    });

    if (Object.keys(versions).length === 0) {
      return null;
    }

    info.version = Object.keys(versions).join(', ');
    info.versionMismatch = Object.keys(versions).length !== 1;
    return info;
  }

  getCaaspNodeData(n: KubernetesNode): CaaspNodeData | undefined {
    if (n && n.metadata && n.metadata.annotations) {
      return {
        version: n.metadata.annotations[CAASP_VERSION_ANNOTATION],
        updates: this.hasBooleanAnnotation(n.metadata.annotations, CAASP_HAS_UPDATES_ANNOTATION),
        disruptiveUpdates: this.hasBooleanAnnotation(n.metadata.annotations, CAASP_DISRUPTIVE_UPDATES_ANNOTATION),
        securityUpdates: this.hasBooleanAnnotation(n.metadata.annotations, CAASP_SECURITY_UPDATES_ANNOTATION)
      };
    }
    return undefined;
  }

  // Check for the specified annotation with a value of 'yes'
  private hasBooleanAnnotation(annotations: Annotations, annotation: string): boolean {
    return annotations[annotation] && annotations[annotation] === 'yes' ? true : false;
  }

  getNodeKubeVersions(nodes: KubernetesNode[]): string {
    const versions: Record<string, string> = {};
    nodes.forEach(node => {
      const v = node.status.nodeInfo?.kubeletVersion;
      if (v && !versions[v]) {
        versions[v] = v;
      }
    });
    return Object.keys(versions).join(',');
  }

  getPodCapacity(nodes: KubernetesNode[], pods: KubernetesPod[]) {
    return {
      total: nodes.reduce((cap, node) => {
        const podCapacity = node.status.capacity?.pods;
        return cap + (podCapacity ? parseInt(podCapacity, 10) : 0);
      }, 0),
      used: pods.length
    };
  }

  getNodeStatusCount(
    nodes: KubernetesNode[],
    conditionType: string,
    valueLabels: Record<string, any> = {},
    countStatus = 'True'
  ): any {
    const total = nodes.length;
    const { unknown, unavailable, used } = nodes.reduce((cap, node) => {
      const conditionStatus = node.status.conditions.find(con => con.type === conditionType);
      if (!conditionStatus || !conditionStatus.status) {
        ++cap.unavailable;
      } else {
        if (conditionStatus.status === countStatus) {
          ++cap.used;
        } else if (conditionStatus.status === 'Unknown') {
          ++cap.unknown;
        }
      }
      return cap;
    }, { unavailable: 0, used: 0, unknown: 0 });
    const result = {
      total,
      supported: total !== unavailable,
      // Depends on K8S version as to what is supported
      unavailable,
      used,
      unknown,
      ...valueLabels
    };
    result.supported = result.total !== result.unavailable;
    return result;
  }

  private constructCoreObservables() {
    const kubeGuid = this.kubeGuid;
    if (!this.endpointsService.endpoints().has(kubeGuid)) {
      // Loads the endpoints map if nothing has yet.
      void this.endpointsService.whenReady();
    }
    this.endpoint = computed(() => this.endpointsService.endpoints().get(kubeGuid));

    // Cached via shareReplay so the page's bindings share one request.
    this.kubeDashboardStatus$ = KubernetesEndpointService
      .getKubeDashboardStatus(this.http, this.session, this.kubeGuid)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }
}
