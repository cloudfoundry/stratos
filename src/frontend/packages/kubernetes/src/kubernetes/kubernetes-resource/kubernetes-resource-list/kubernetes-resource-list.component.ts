import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

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
  KubernetesCurrentNamespace,
  SimpleColumnValueGetter,
  SimpleKubeListColumn,
} from '../../store/kube.types';
import { getHelmReleaseDetailsFromGuid } from '../../workloads/store/workloads-entity-factory';
import { SetCurrentNamespaceAction } from './../../store/kubernetes.actions';

const namespaceColumnId = 'namespace';

@Component({
  selector: 'app-kubernetes-resource-list',
  templateUrl: './kubernetes-resource-list.component.html',
  styleUrls: ['./kubernetes-resource-list.component.scss'],
})
export class KubernetesResourceListComponent implements OnDestroy {

  public entityCatalogKey: string;

  public namespaces$: Observable<string[]>;

  selectedNamespace: string;

  public showNamespaceLink = true;

  public provider: ActionListConfigProvider<KubeAPIResource>;

  public isNamespacedView = true;
  public isWorkloadView = false;

  private sub: Subscription;
  private kubeId: string;
  private workloadTitle: string;
  private workloadNamespace: string;

  constructor(
    private store: Store<any>,
    private route: ActivatedRoute,
    router: Router,
    kubeId: BaseKubeGuid,
    private uiConfigService: KubernetesUIConfigService
  ) {
    // Entity Catalog Key can be specified in the route config
    this.entityCatalogKey = route.snapshot.data.entityCatalogKey;
    if (!this.entityCatalogKey) {
      // Default is to use the last part of the route
      const routeParts = router.url.split('/');
      this.entityCatalogKey = routeParts[routeParts.length - 1];
    }

    const catalogEntity = entityCatalog.getEntityFromKey(entityCatalog.getEntityKey(KUBERNETES_ENDPOINT_TYPE, this.entityCatalogKey));
    if (!catalogEntity) {
      console.error(`Can not find catalog entity for Kubernetes entity ${this.entityCatalogKey}`);
      return;
    }

    // Workload
    if (route.snapshot.data?.isWorkload) {
      this.isWorkloadView = true;
      const { endpointId, namespace, releaseTitle } = getHelmReleaseDetailsFromGuid(this.route.snapshot.parent.parent.params.guid);
      this.kubeId = endpointId;
      this.workloadNamespace = namespace;
      this.workloadTitle = releaseTitle;
    } else {
      // Namespaced
      this.kubeId = kubeId.guid;
      const namespacesObs = kubeEntityCatalog.namespace.store.getPaginationService(kubeId.guid);
      this.namespaces$ = namespacesObs.entities$.pipe(map(ns => ns.map(n => n.metadata.name)));

      // Watch for namespace changes
      this.sub = this.store.select<KubernetesCurrentNamespace>(state => state.k8sCurrentNamespace).pipe(
        map(data => data[this.kubeId]),
        filter(data => !!data)
      ).subscribe(ns => {
        this.selectedNamespace = ns === '*' ? undefined : ns;
        if (this.isNamespacedView) {
          this.createProvider(catalogEntity);
        }
      });
    }

    this.createProvider(catalogEntity);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private createProvider(catalogEntity: any) {
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
    this.provider = provider;
  }

  select(item?: string) {
    this.store.dispatch(new SetCurrentNamespaceAction(this.kubeId, item));
  }

  private getColumns(definition: KubeResourceEntityDefinition): ITableColumn<KubeAPIResource>[] {
    const component = this.uiConfigService.previewComponent.get(definition.type);
    let columns: Array<ITableColumn<KubeAPIResource>> = [
      // Name
      {
        columnId: 'name', headerCell: () => 'Name',
        cellComponent: TableCellSidePanelComponent,
        sort: {
          type: 'sort',
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
          type: 'sort',
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
        type: 'sort',
        orderKey: tableCell.columnId,
        field: cell.field as string
      };
    }

    return tableCell;
  }
}
