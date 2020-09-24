import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, first, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { GetAllEndpoints } from '../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../store/src/app-state';
import { EntityService } from '../../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { PaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel, EndpointUser } from '../../../../../store/src/types/endpoint.types';
import { kubeEntityCatalog } from '../kubernetes-entity-catalog';
import { BaseKubeGuid } from '../kubernetes-page.types';
import {
  KubernetesDeployment,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
} from '../store/kube.types';
import { KubeDashboardStatus } from '../store/kubernetes.effects';
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


@Injectable()
export class KubernetesEndpointService {
  info$: Observable<EntityInfo<any>>;
  cfInfoEntityService: EntityService<any>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  kubeEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;
  kubeGuid: string;
  deployments$: Observable<KubernetesDeployment[]>;
  statefulSets$: Observable<KubernetesStatefulSet[]>;
  services$: Observable<KubeService[]>;
  pods$: Observable<KubernetesPod[]>;
  nodes$: Observable<KubernetesNode[]>;
  kubeDashboardEnabled$: Observable<boolean>;
  kubeDashboardVersion$: Observable<string>;
  kubeDashboardStatus$: Observable<KubeDashboardStatus>;
  kubeDashboardLabel$: Observable<string>;
  kubeDashboardConfigured$: Observable<boolean>;
  kubeTerminalEnabled$: Observable<boolean>;

  constructor(
    public baseKube: BaseKubeGuid,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    const kubeGuid = baseKube.guid;

    if (kubeGuid) {
      this.initialize(kubeGuid);
    }
  }

  initialize(kubeGuid) {
    this.kubeGuid = kubeGuid;

    this.kubeEndpointEntityService = this.entityServiceFactory.create(
      this.kubeGuid,
      new GetAllEndpoints()
    );

    this.constructCoreObservables();
  }

  getCaaspNodesData(nodes$: Observable<KubernetesNode[]> = this.nodes$): Observable<CaaspNodesData> {
    return nodes$.pipe(
      map(nodes => {
        const info: CaaspNodesData = {
          version: 'Unknown',
          versionMismatch: false,
          updates: 0,
          disruptiveUpdates: 0,
          securityUpdates: 0
        };
        const versions = {};

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
    )
  }

  getCaaspNodeData(n: KubernetesNode): CaaspNodeData {
    if (n && n.metadata && n.metadata.annotations) {
      return {
        version: n.metadata.annotations[CAASP_VERSION_ANNOTATION],
        updates: this.hasBooleanAnnotation(n.metadata.annotations, CAASP_HAS_UPDATES_ANNOTATION),
        disruptiveUpdates: this.hasBooleanAnnotation(n.metadata.annotations, CAASP_DISRUPTIVE_UPDATES_ANNOTATION),
        securityUpdates: this.hasBooleanAnnotation(n.metadata.annotations, CAASP_SECURITY_UPDATES_ANNOTATION)
      }
    }
  }

  // Check for the specified annotation with a value of 'yes'
  private hasBooleanAnnotation(annotations: Annotations, annotation: string): boolean {
    return annotations[annotation] && annotations[annotation] === 'yes' ? true : false
  }

  getNodeKubeVersions(nodes$: Observable<KubernetesNode[]> = this.nodes$) {
    return nodes$.pipe(
      map(nodes => {
        const versions = {};
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

  getCountObservable(entities$: Observable<any[]>) {
    return entities$.pipe(
      map(entities => entities.length),
      startWith(null)
    );
  }

  getPodCapacity(nodes$: Observable<KubernetesNode[]> = this.nodes$, pods$: Observable<KubernetesPod[]> = this.pods$) {
    return combineLatest(nodes$, pods$).pipe(
      map(([nodes, pods]) => ({
        total: nodes.reduce((cap, node) => {
          return cap + parseInt(node.status.capacity.pods, 10);
        }, 0),
        used: pods.length
      }))
    );
  }

  getNodeStatusCount(
    nodes$: Observable<KubernetesNode[]>,
    conditionType: string,
    valueLabels: object = {},
    countStatus = 'True'
  ) {
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

    this.deployments$ = this.getObservable<KubernetesDeployment>(kubeEntityCatalog.deployment.store.getPaginationService(this.kubeGuid));

    this.pods$ = this.getObservable<KubernetesPod>(kubeEntityCatalog.pod.store.getPaginationService(this.kubeGuid));

    this.nodes$ = this.getObservable<KubernetesNode>(kubeEntityCatalog.node.store.getPaginationService(this.kubeGuid))

    this.statefulSets$ = this.getObservable<KubernetesStatefulSet>(kubeEntityCatalog.statefulSet.store.getPaginationService(this.kubeGuid));

    this.services$ = this.getObservable<KubeService>(kubeEntityCatalog.service.store.getPaginationService(this.kubeGuid));

    this.kubeDashboardEnabled$ = this.store.select('auth').pipe(
      filter(auth => !!auth.sessionData['plugin-config']),
      map(auth => auth.sessionData['plugin-config'].kubeDashboardEnabled === 'true')
    );

    this.kubeTerminalEnabled$ = this.store.select('auth').pipe(
      filter(auth => !!auth.sessionData['plugin-config']),
      map(auth => auth.sessionData['plugin-config'].kubeTerminalEnabled === 'true')
    );

    const kubeDashboardStatus$ = kubeEntityCatalog.dashboard.store.getEntityService(this.kubeGuid).waitForEntity$.pipe(
      map(status => status.entity),
      filter(status => !!status)
    );

    this.kubeDashboardStatus$ = this.kubeDashboardEnabled$.pipe(
      switchMap(enabled => enabled ? kubeDashboardStatus$ : of(null)),
    );

    this.kubeDashboardConfigured$ = this.kubeDashboardStatus$.pipe(
      map(status => status && status.installed && !!status.serviceAccount && !!status.service),
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
    kubeEntityCatalog.dashboard.api.get(this.kubeGuid);
  }

  private getObservable<T>(obs: PaginationObservables<T>): Observable<T[]> {
    return obs.entities$.pipe(filter(p => !!p), first());
  }

}
