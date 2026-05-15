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
import { Store } from '@stratosui/store';
import { Observable, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageSubNavComponent, ListViewComponent, SignalListComponent, SignalListConfig } from '@stratosui/core';
import { GeneralAppState } from '../../../../../store/src/app-state';

import { ListConfigUpdate } from '../../../../../core/src/shared/components/list/list-generics/list-config-provider.types';
import {
  ActionListConfigProvider,
} from '../../../../../core/src/shared/components/list/list-generics/list-providers/action-list-config-provider';
import {
  TableCellSidePanelComponent,
  TableCellSidePanelConfig,
} from '../../../../../core/src/shared/components/list/list-table/table-cell-side-panel/table-cell-side-panel.component';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { ListViewTypes } from '../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../store/src/public-api';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import {
  KubernetesResourceViewerComponent,
  KubernetesResourceViewerConfig,
} from '../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { KubernetesUIConfigService } from '../../kubernetes-ui-service';
import { defaultHelmKubeListPageSize } from '../../list-types/kube-helm-list-types';
import { createKubeAgeColumn } from '../../list-types/kube-list.helper';
import {
  KubeAPIResource,
  KubeResourceEntityDefinition,
  SimpleColumnValueGetter,
  SimpleKubeListColumn,
} from '../../store/kube.types';
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

const namespaceColumnId = 'namespace';

@Component({
  selector: 'app-kubernetes-resource-list',
  templateUrl: './kubernetes-resource-list.component.html',
  styleUrls: ['./kubernetes-resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageSubNavComponent,
    ListViewComponent,
    SignalListComponent,
  ]
})
export class KubernetesResourceListComponent implements OnDestroy {

  public entityCatalogKey: string;

  public namespaces$: Observable<string[]>;

  selectedNamespace: string;

  public showNamespaceLink = true;

  public provider: ActionListConfigProvider<KubeAPIResource>;

  public isNamespacedView = true;
  public isWorkloadView = false;
  public menuOpen = false;

  // Signal-native code path: when the entity type is registered with
  // KubernetesSignalConfigRegistry, the shell builds a SignalListConfig
  // and renders <app-signal-list> instead of the legacy <app-list-view>.
  // useSignalList = !!signalListConfig().
  public readonly signalListConfig: WritableSignal<SignalListConfig<unknown> | undefined> = signal(undefined);
  // Drives the signal-config dataSignal projection — namespace dropdown
  // writes flow into here so factories that consume `selectedNamespace`
  // re-evaluate (cluster-wide vs namespaced fetch).
  private readonly _selectedNamespaceSignal: WritableSignal<string | undefined> = signal(undefined);
  public readonly selectedNamespaceSignal = this._selectedNamespaceSignal.asReadonly();

  private sub: Subscription;
  private kubeId: string;
  private workloadTitle: string;
  private workloadNamespace: string;
  private store = inject(Store<GeneralAppState>);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private baseKubeGuid = inject(BaseKubeGuid);
  private uiConfigService = inject(KubernetesUIConfigService);
  private signalConfigRegistry = inject(KubernetesSignalConfigRegistry);
  private currentNamespaceService = inject(KubeCurrentNamespaceService);
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
      const { endpointId, namespace, releaseTitle } = getHelmReleaseDetailsFromGuid(this.route.snapshot.parent.parent.params.guid);
      this.kubeId = endpointId;
      this.workloadNamespace = namespace;
      this.workloadTitle = releaseTitle;
    } else {
      // Namespaced
      this.kubeId = this.baseKubeGuid.guid;
      const namespacesObs = kubeEntityCatalog.namespace.store.getPaginationService(this.baseKubeGuid.guid);
      this.namespaces$ = namespacesObs.entities$.pipe(map(ns => ns.map(n => n.metadata.name)));

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
        // Mirror into the signal so the signal-config factory's
        // computed() data projection re-evaluates.
        this._selectedNamespaceSignal.set(this.selectedNamespace);
        if (this.isNamespacedView && !this.signalListConfig()) {
          // Only rebuild the legacy provider when we're NOT on the
          // signal-config path — signal-configs react to the namespace
          // signal directly without a rebuild.
          this.createProvider(catalogEntity as any);
        }
      });
    }

    // Signal-config path: if the registry has an entry for this entity
    // type, build a SignalListConfig and skip the legacy provider.
    const signalFactory = this.signalConfigRegistry.get(this.entityCatalogKey);
    if (signalFactory && !this.isWorkloadView) {
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

    this.createProvider(catalogEntity as any);


  }

  // Resolve the signal-config code path — kick the per-endpoint
  // registry cache so cluster-scoped state (namespaces, version, node
  // count) populates on first paint, plus kick the per-resource data
  // service so the page's primary list populates without waiting for the
  // user's first refresh click. Idempotent: subsequent visits return
  // immediately from the cache.
  private warmRegistryCache(): void {
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

  private createProvider(catalogEntity: { definition: KubeResourceEntityDefinition; actions: any }) {
    this.isNamespacedView = !this.isWorkloadView && !!catalogEntity.definition.apiNamespaced;
    let action;
    if (this.isWorkloadView) {
      action = catalogEntity.actions.getInWorkload(this.kubeId, this.workloadNamespace, this.workloadTitle);
    } else if (this.selectedNamespace && this.isNamespacedView) {
      action = catalogEntity.actions.getInNamespace(this.kubeId, this.selectedNamespace);
    } else {
      action = catalogEntity.actions.getMultiple(this.kubeId);
    }

    const provider = new ActionListConfigProvider<KubeAPIResource>(this.store, action);
    const listConfigName = catalogEntity.definition ? catalogEntity.definition.listConfig : null;
    const listConfig: ListConfigUpdate<any> = this.uiConfigService.listConfig.get(listConfigName) || {
      pageSizeOptions: defaultHelmKubeListPageSize,
      viewType: ListViewTypes.TABLE_ONLY,
      enableTextFilter: true,
      text: {
        title: null,
        filter: 'Filter by Name',
        noEntries: 'There are no resources'
      },
      getColumns: () => this.getColumns(catalogEntity.definition),
    };
    listConfig.hideRefresh = this.isWorkloadView;

    provider.updateListConfig(listConfig);
    provider.updateDataSourceConfig({
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
    this.provider = provider;
  }

  select(item?: string) {
    this.currentNamespaceService.set(this.kubeId, item);
  }

  private getColumns(definition: KubeResourceEntityDefinition): ITableColumn<KubeAPIResource>[] {
    const component = this.uiConfigService.previewComponent.get(definition.type);
    let columns: Array<ITableColumn<KubeAPIResource>> = [
      // Name
      {
        columnId: 'name', headerCell: () => 'Name',
        cellComponent: TableCellSidePanelComponent,
        sort: {
          type: 'natural-sort',
          orderKey: 'name',
          field: 'metadata.name'
        },
        cellFlex: '3',
        cellConfig: (resource): TableCellSidePanelConfig<KubernetesResourceViewerConfig> => {
          return ({
            text: resource.metadata.name,
            sidePanelComponent: KubernetesResourceViewerComponent,
            sidePanelConfig: {
              title: resource.metadata.name,
              resourceKind: definition.label,
              resource$: of(resource),
              component,
              definition,
            }
          });
        }
      },
      // Namespace
      {
        columnId: namespaceColumnId, headerCell: () => 'Namespace',
        cellDefinition: {
          valuePath: 'metadata.namespace',
          getLink: row => this.showNamespaceLink ? `/kubernetes/${this.kubeId}/namespaces/${row.metadata.namespace}` : null
        },
        sort: {
          type: 'natural-sort',
          orderKey: namespaceColumnId,
          field: 'metadata.namespace'
        },
        cellFlex: '2',
      },
    ];

    // We hide the namespace column if we are in a given namespace OR the resource is not namespaced
    // let hideNamespaceColumn = !!this.selectedNamespace;
    let hideNamespaceColumn = false;
    if (definition && definition.apiNamespaced === false) {
      hideNamespaceColumn = true;
    }

    if (hideNamespaceColumn) {
      // Hide the namespace column
      columns = columns.filter(column => column.columnId !== namespaceColumnId);
    }

    if (definition && definition.listColumns) {
      definition.listColumns.forEach(c => columns.push(this.simpleCellToTableCell(c)));
    }

    columns.push(createKubeAgeColumn());
    return columns;
  }

  private simpleCellToTableCell(cell: SimpleKubeListColumn): ITableColumn<KubeAPIResource> {

    const tableCell: ITableColumn<KubeAPIResource> = {
      columnId: cell.header.toLowerCase(),
      headerCell: () => cell.header,
      cellDefinition: {},
      cellFlex: cell.flex || '1'
    };

    if (typeof (cell.field) === 'string') {
      tableCell.cellDefinition.valuePath = cell.field as string;
    } else {
      tableCell.cellDefinition.getValue = cell.field as SimpleColumnValueGetter<KubeAPIResource>;
    }

    if (cell.sort && typeof (cell.field) === 'string') {
      tableCell.sort = {
        type: 'natural-sort',
        orderKey: tableCell.columnId,
        field: cell.field as string
      };
    }

    return tableCell;
  }
}
