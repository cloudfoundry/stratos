import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  Injector,
  OnDestroy,
  WritableSignal,
  inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageSubNavComponent, SignalListComponent, SignalListConfig } from '@stratosui/core';
import { entityCatalog } from '../../../../../store/src/public-api';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubeResourceEntityDefinition } from '../../store/kube.types';
import { getHelmReleaseDetailsFromGuid } from '../../workloads/store/workloads-entity-factory';
import { KubeCurrentNamespaceService } from '../../../services/domain-data/kube-current-namespace.service';
import { KubernetesSignalConfigRegistry } from '../kubernetes-signal-config-registry';
import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubePodDataService } from '../../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../../services/domain-data/kube-service-data.service';
import {
  KubeClusterRoleDataService,
  KubeConfigMapDataService,
  KubeDeploymentDataService,
  KubeJobDataService,
  KubePersistentVolumeClaimDataService,
  KubePersistentVolumeDataService,
  KubeReplicaSetDataService,
  KubeRoleDataService,
  KubeSecretDataService,
  KubeServiceAccountDataService,
  KubeStatefulSetDataService,
  KubeStorageClassDataService,
} from '../../../services/domain-data/kube-generic-resource-data.services';
import {
  kubernetesConfigMapEntityType,
  kubernetesDeploymentsEntityType,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
  kubernetesStatefulSetsEntityType,
} from '../../kubernetes-entity-factory';

@Component({
  selector: 'app-kubernetes-resource-list',
  templateUrl: './kubernetes-resource-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageSubNavComponent,
    SignalListComponent,
  ]
})
export class KubernetesResourceListComponent implements OnDestroy {

  public entityCatalogKey: string;

  // Only populated in the namespaced (non-workload) branch; the workload
  // view leaves it unset. Template guards with @if (namespaces$).
  public namespaces$?: Observable<string[]>;

  // undefined represents the "All namespaces" (cluster-wide) selection.
  selectedNamespace?: string;

  public isNamespacedView = true;
  public isWorkloadView = false;
  public menuOpen = false;

  // Signal-native code path: when the entity type is registered with
  // KubernetesSignalConfigRegistry, the shell builds a SignalListConfig
  // and renders <app-signal-list>. For unregistered types (vestigial
  // generic-route hits), the constructor redirects to the cluster summary.
  public readonly signalListConfig: WritableSignal<SignalListConfig<unknown> | undefined> = signal(undefined);
  // Drives the signal-config dataSignal projection — namespace dropdown
  // writes flow into here so factories that consume `selectedNamespace`
  // re-evaluate (cluster-wide vs namespaced fetch).
  private readonly _selectedNamespaceSignal: WritableSignal<string | undefined> = signal(undefined);
  public readonly selectedNamespaceSignal = this._selectedNamespaceSignal.asReadonly();

  private sub?: Subscription;
  // strict: assigned in both constructor branches (workload + namespaced),
  // which run after the catalogEntity guard's early return.
  private kubeId!: string;
  // Only set in the workload branch; the signal-config factory params type
  // these as optional.
  private workloadTitle?: string;
  private workloadNamespace?: string;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private baseKubeGuid = inject(BaseKubeGuid);
  private signalConfigRegistry = inject(KubernetesSignalConfigRegistry);
  private currentNamespaceService = inject(KubeCurrentNamespaceService);
  private namespaceData = inject(KubeNamespaceDataService);
  private injector = inject(Injector);



  constructor() {


    // Entity Catalog Key can be specified in the route config
    this.entityCatalogKey = this.route.snapshot.data.entityCatalogKey;
    if (!this.entityCatalogKey) {
      // Default is to use the last part of the route
      const routeParts = this.router.url.split('/');
      this.entityCatalogKey = routeParts[routeParts.length - 1];
    }

    const catalogEntity = entityCatalog.getEntityFromKey(entityCatalog.getEntityKey(KUBERNETES_ENDPOINT_TYPE, this.entityCatalogKey));
    if (!catalogEntity) {
      console.error(`Can not find catalog entity for Kubernetes entity ${this.entityCatalogKey}`);
      return;
    }

    // Workload
    if (this.route.snapshot.data?.isWorkload) {
      this.isWorkloadView = true;
      const workloadGuid = this.route.snapshot.parent?.parent?.params.guid;
      if (!workloadGuid) {
        console.error('Can not resolve workload guid from route for Kubernetes resource list');
        return;
      }
      const { endpointId, namespace, releaseTitle } = getHelmReleaseDetailsFromGuid(workloadGuid);
      this.kubeId = endpointId;
      this.workloadNamespace = namespace;
      this.workloadTitle = releaseTitle;
    } else {
      // Namespaced
      this.kubeId = this.baseKubeGuid.guid;
      void this.namespaceData.refresh({ kubeGuid: this.kubeId });
      this.namespaces$ = toObservable(this.namespaceData.namespacesForEndpoint(this.kubeId), { injector: this.injector })
        .pipe(map(ns => ns.map(n => n.metadata.name)));

      // Watch for namespace changes via the signal-native current-namespace
      // service. effect() runs whenever the per-endpoint selection signal
      // emits a new value — replaces the legacy ngrx select+filter chain.
      const nsSignal = this.currentNamespaceService.forEndpoint(this.kubeId);
      effect(() => {
        const ns = nsSignal();
        if (!ns) {
          return;
        }
        this.selectedNamespace = ns === '*' ? undefined : ns;
        this._selectedNamespaceSignal.set(this.selectedNamespace);
      });
    }

    // Signal-config path: if the registry has an entry for this entity
    // type, build a SignalListConfig and skip the legacy provider.
    const signalFactory = this.signalConfigRegistry.get(this.entityCatalogKey);
    if (signalFactory) {
      this.isNamespacedView = !!(catalogEntity as unknown as { definition?: KubeResourceEntityDefinition }).definition?.apiNamespaced;
      const config = signalFactory(
        {
          kubeGuid: this.kubeId,
          selectedNamespace: this._selectedNamespaceSignal.asReadonly(),
          isWorkloadView: this.isWorkloadView,
          workloadNamespace: this.workloadNamespace,
          workloadTitle: this.workloadTitle,
        },
        this.injector,
      );
      this.signalListConfig.set(config);
      // Kick the registry-backed cache so the underlying signal
      // populates on first paint. Errors flow into the signal-config's
      // errors() and surface in the toolbar.
      this.warmRegistryCache();
      return;
    }

    // No signal factory for this entity type. The only keys that reach here
    // are vestigial generic-route hits (node/dashboard/analysisReport) which
    // have dedicated routes and no generic-list config — never linked. Send
    // them to the cluster summary rather than the retired ngrx list path.
    this.router.navigate(['/kubernetes', this.kubeId]);
    return;

  }

  // Resolve the signal-config code path — kick the per-endpoint
  // registry cache so cluster-scoped state (namespaces, version, node
  // count) populates on first paint, plus kick the per-resource data
  // service so the page's primary list populates without waiting for the
  // user's first refresh click. Idempotent: subsequent visits return
  // immediately from the cache.
  private warmRegistryCache(): void {
    // Workload view is socket-fed (HelmReleaseSocketService, started by the
    // parent tab-base). No REST kick — data arrives via the /status stream.
    if (this.isWorkloadView) {
      return;
    }
    const reg = this.injector.get(KubeEndpointDataRegistry);
    const svc = reg.getService(this.kubeId);
    svc.load().subscribe({ next: () => undefined, error: () => undefined });

    // Kick the per-resource data service so the page's primary list
    // populates without a user gesture. Each domain service dedups
    // in-flight requests internally.
    if (this.entityCatalogKey === kubernetesPodsEntityType) {
      const podData = this.injector.get(KubePodDataService);
      void podData.refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === kubernetesServicesEntityType) {
      const serviceData = this.injector.get(KubeServiceDataService);
      void serviceData.refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === kubernetesConfigMapEntityType) {
      void this.injector.get(KubeConfigMapDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'secrets') {
      void this.injector.get(KubeSecretDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === kubernetesDeploymentsEntityType) {
      void this.injector.get(KubeDeploymentDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'replicaSet') {
      void this.injector.get(KubeReplicaSetDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === kubernetesStatefulSetsEntityType) {
      void this.injector.get(KubeStatefulSetDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'persistentVolume') {
      void this.injector.get(KubePersistentVolumeDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'persistentVolumeClaims') {
      void this.injector.get(KubePersistentVolumeClaimDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'storageClass') {
      void this.injector.get(KubeStorageClassDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'job') {
      void this.injector.get(KubeJobDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'clusterRole') {
      void this.injector.get(KubeClusterRoleDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'role') {
      void this.injector.get(KubeRoleDataService).refresh({ kubeGuid: this.kubeId });
    } else if (this.entityCatalogKey === 'serviceAccount') {
      void this.injector.get(KubeServiceAccountDataService).refresh({ kubeGuid: this.kubeId });
    }
    // namespaces — no extra kick needed; svc.load() above fetches the
    // namespace list as part of the cluster-scoped state.
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  select(item?: string) {
    this.currentNamespaceService.set(this.kubeId, item);
  }
}
