import { HttpClient } from '@angular/common/http';
import { Injectable, computed, Injector, inject, runInInjectionContext } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';

import {
  GetAllEndpoints,
  EntityService,
  EntityServiceFactory,
  EndpointModel,
  EntityInfo,
  EndpointUser,
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


@Injectable({
  providedIn: 'root'
})
export class KubernetesEndpointService {
  baseKube = inject(BaseKubeGuid);
  private session = inject(SessionService);
  private http = inject(HttpClient);
  private entityServiceFactory = inject(EntityServiceFactory);

  info$: Observable<EntityInfo<any>>;
  cfInfoEntityService: EntityService<any>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  kubeEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;
  kubeGuid!: string;
  kubeDashboardEnabled$: Observable<boolean>;
  kubeDashboardVersion$: Observable<string>;
  kubeDashboardStatus$: Observable<KubeDashboardStatus | null>;
  kubeDashboardLabel$: Observable<string>;
  kubeDashboardConfigured$: Observable<boolean>;
  kubeTerminalEnabled$: Observable<boolean>;

  private injector = inject(Injector);

  // Static helpers retained as a public surface for callers outside the
  // service instance lifecycle (e.g. KubernetesHomeCardComponent's
  // imperative load() method). Wave-3.5 dropped the @ngrx Store
  // dependency; the helpers now require SessionService + HttpClient
  // injected by the caller (mirrors the wave-3 cf-autoscaler pattern).
  public static hasKubeTerminalEnabled(session: SessionService): Observable<boolean> {
    const pluginConfig = session.sessionData()?.['plugin-config'];
    return of(pluginConfig?.kubeTerminalEnabled === 'true');
  }

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

  public static kubeDashboardConfigured(http: HttpClient, session: SessionService, kubeGuid: string): Observable<boolean> {
    return KubernetesEndpointService.getKubeDashboardStatus(http, session, kubeGuid).pipe(
      map(status => !!(status && status.installed && !!status.serviceAccount && !!status.service)),
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

    this.kubeEndpointEntityService = this.entityServiceFactory.create(
      this.kubeGuid,
      new GetAllEndpoints()
    );

    this.constructCoreObservables();
  }

  getCaaspNodesData(nodes$: Observable<KubernetesNode[]>): Observable<CaaspNodesData> {
    return nodes$.pipe(
      map(nodes => {
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
      })
    );
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

  getNodeKubeVersions(nodes$: Observable<KubernetesNode[]>): Observable<string> {
    return nodes$.pipe(
      map(nodes => {
        const versions: Record<string, string> = {};
        nodes.forEach(node => {
          const v = node.status.nodeInfo.kubeletVersion;
          if (!versions[v]) {
            versions[v] = v;
          }
        });
        return Object.keys(versions).join(',');
      })
    );
  }

  getCountObservable(entities$: Observable<any[]>): Observable<number | null> {
    return entities$.pipe(
      map(entities => entities.length),
      startWith(null)
    );
  }

  getPodCapacity(nodes$: Observable<KubernetesNode[]>, pods$: Observable<KubernetesPod[]>) {
    // Convert to signals within injection context
    return runInInjectionContext(this.injector, () => {
      const nodesSignal = toSignal(nodes$, { initialValue: [] as KubernetesNode[] });
      const podsSignal = toSignal(pods$, { initialValue: [] as KubernetesPod[] });

      // Compute capacity
      const capacityComputed = computed(() => {
        const nodes = nodesSignal();
        const pods = podsSignal();
        return {
          total: nodes.reduce((cap, node) => {
            return cap + parseInt(node.status.capacity.pods, 10);
          }, 0),
          used: pods.length
        };
      });

      return toObservable(capacityComputed);
    });
  }

  getNodeStatusCount(
    nodes$: Observable<KubernetesNode[]>,
    conditionType: string,
    valueLabels: Record<string, any> = {},
    countStatus = 'True'
  ): Observable<any> {
    return nodes$.pipe(
      map(nodes => {
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
      })
    );
  }

  private constructCoreObservables() {
    this.endpoint$ = this.kubeEndpointEntityService.waitForEntity$;

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user), shareReplay(1));

    // Plugin-config-derived flags — read off the SessionService signal,
    // mirrored back into Observables for template consumers.
    const pluginConfig = () => this.session.sessionData()?.['plugin-config'];

    this.kubeDashboardEnabled$ = of(pluginConfig()?.kubeTerminalEnabled === 'true');
    this.kubeTerminalEnabled$ = of(pluginConfig()?.kubeTerminalEnabled === 'true');

    // Wave-3.5: dashboard status now fetched directly from the kubedash
    // status endpoint. The legacy ngrx-backed entity-catalog dashboard
    // slice is being deleted — this read replaces both the entity
    // service.waitForEntity$ chain and the dispatch that used to seed
    // it. Cached via shareReplay so the multiple template bindings
    // (status, label, configured) share one wire request.
    this.kubeDashboardStatus$ = KubernetesEndpointService
      .getKubeDashboardStatus(this.http, this.session, this.kubeGuid)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.kubeDashboardConfigured$ = this.kubeDashboardStatus$.pipe(
      map(status => !!(status && status.installed && !!status.serviceAccount && !!status.service)),
    );

    this.kubeDashboardLabel$ = this.kubeDashboardStatus$.pipe(
      map(status => {
        if (!status) {
          return '';
        }
        if (!status.installed) {
          return 'Not installed';
        } else if (!status.serviceAccount) {
          return 'Not configured';
        } else {
          return status.version;
        }
      })
    );
  }

  public refreshKubernetesDashboardStatus() {
    // Re-fetch the status directly. Replaces the legacy
    // `kubeEntityCatalog.dashboard.api.get(guid)` ngrx dispatch.
    this.kubeDashboardStatus$ = KubernetesEndpointService
      .getKubeDashboardStatus(this.http, this.session, this.kubeGuid)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }
}
