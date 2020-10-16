import { Injectable, Optional } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IListDataSource,
} from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { of } from 'rxjs';

import { ListDataSource } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  TableCellSidePanelComponent,
  TableCellSidePanelConfig,
} from '../../../../../core/src/shared/components/list/list-table/table-cell-side-panel/table-cell-side-panel.component';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../store/src/app-state';
import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import {
  KubernetesResourceViewerComponent,
  KubernetesResourceViewerConfig,
} from '../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { defaultHelmKubeListPageSize } from '../../list-types/kube-helm-list-types';
import { createKubeAgeColumn } from '../../list-types/kube-list.helper';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubeAPIResource, SimpleKubeListColumn } from './../../store/kube.types';


export abstract class KubernetesBaseResourceListConfigService implements IListConfig<KubeAPIResource> {

  static namespaceColumnId = 'namespace';
  public showNamespaceLink = true;

  public catalogEntity; any;

  constructor(private kubeId: string) {}

  columns: Array<ITableColumn<KubeAPIResource>> = [
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
          resourceKind: this.catalogEntity.definition.label,
          resource$: of(resource)
        }
      })
      }
    },
    // Namespace
    {
      columnId: KubernetesBaseResourceListConfigService.namespaceColumnId, headerCell: () => 'Namespace',
      cellDefinition: {
        valuePath: 'metadata.namespace',
        getLink: row => this.showNamespaceLink ? `/kubernetes/${this.kubeId}/namespaces/${row.metadata.namespace}` : null
      },
      sort: {
        type: 'sort',
        orderKey: KubernetesBaseResourceListConfigService.namespaceColumnId,
        field: 'metadata.namespace'
      },
      cellFlex: '2',
    },
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no resources'
  };
  abstract getDataSource: () => IListDataSource<KubeAPIResource>;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getMultiFiltersConfigs = () => [];
}

class KubernetesResourceDataSource extends ListDataSource<KubeAPIResource> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<KubeAPIResource>,
    action: any
  ) {
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (row) => action.entity[0].getId(row),
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }
}


@Injectable()
export class KubernetesResourceListConfigService extends KubernetesBaseResourceListConfigService {
  private resourceDataSource: KubernetesResourceDataSource;

  getDataSource = () => this.resourceDataSource;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    route: ActivatedRoute,
    router: Router,
    @Optional() kubeNamespaceService: KubernetesNamespaceService,
  ) {
    super(kubeId.guid);

    let entityCatalogKey = route.snapshot.data.entityCatalogKey;
    if (!entityCatalogKey) {
      // Default is to use the last part of the route
      const routeParts = router.url.split('/');
      entityCatalogKey = routeParts[routeParts.length - 1];
    }

    this.catalogEntity = kubeEntityCatalog[entityCatalogKey];

    let action;
    if (!!kubeNamespaceService) {
      action = this.catalogEntity.getInNamespace(kubeId.guid, kubeNamespaceService.namespaceName);
    } else {
      action = this.catalogEntity.actions.getMultiple(kubeId.guid);
    }

    // We hide the namespace column if we are in a given namespace OR the resource is not namespaced
    let hideNamespaceColumn = !!kubeNamespaceService;
    if (this.catalogEntity && this.catalogEntity.definition && this.catalogEntity.definition.apiNamespaced === false) {
      hideNamespaceColumn = true;
    }

    if (hideNamespaceColumn) {
      // Hide the namespace column
      this.columns = this.columns.filter(column => column.columnId !== KubernetesBaseResourceListConfigService.namespaceColumnId);
    }

    this.resourceDataSource = new KubernetesResourceDataSource(store, this, action);

    if (this.catalogEntity && this.catalogEntity.definition && this.catalogEntity.definition.listColumns) {
      this.catalogEntity.definition.listColumns.forEach(c => this.columns.push(this.simpleCellToTableCell(c)));
    }

    this.columns.push(createKubeAgeColumn());
  }


  private simpleCellToTableCell(cell: SimpleKubeListColumn): ITableColumn<KubeAPIResource> {

    const tableCell: ITableColumn<KubeAPIResource> = {
      columnId: cell.header.toLowerCase(),
      headerCell: () => cell.header,
      cellDefinition: {
        valuePath: cell.field
      },
      cellFlex: cell.flex || '1'
    };

    if (cell.sort) {
      tableCell.sort = {
        type: 'sort',
        orderKey: tableCell.columnId,
        field: cell.field
      }
    }

    return tableCell;
  }
}

