import { of } from 'rxjs';

import { ListDataSource } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  TableCellSidePanelComponent,
  TableCellSidePanelConfig,
} from '../../../../../../core/src/shared/components/list/list-table/table-cell-side-panel/table-cell-side-panel.component';
import { ITableColumn } from '../../../../../../core/src/shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  KubernetesResourceViewerComponent,
  KubernetesResourceViewerConfig,
} from '../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { KubeService } from '../../store/kube.types';
import { defaultHelmKubeListPageSize } from '../kube-helm-list-types';
import { createKubeAgeColumn } from '../kube-list.helper';
import { KubernetesServicePortsComponent } from '../kubernetes-service-ports/kubernetes-service-ports.component';
import { KubeServiceCardComponent } from './kubernetes-service-card/kubernetes-service-card.component';

export abstract class BaseKubernetesServicesListConfig implements IListConfig<KubeService> {
  columns: Array<ITableColumn<KubeService>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellComponent: TableCellSidePanelComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '4',
      cellConfig: (service): TableCellSidePanelConfig<KubernetesResourceViewerConfig> => ({
        text: service.metadata.name,
        sidePanelComponent: KubernetesResourceViewerComponent,
        sidePanelConfig: {
          title: service.metadata.name,
          resource$: of(service),
          resourceKind: 'service'
        }
      })
    },
    {
      columnId: 'clusterIp',
      headerCell: () => 'Cluster IP',
      cellDefinition: {
        valuePath: 'spec.clusterIP'
      },
      cellFlex: '2'
    },
    {
      columnId: 'portType',
      headerCell: () => 'Port Type',
      cellDefinition: {
        valuePath: 'spec.type'
      },
      cellFlex: '2'
    },
    {
      columnId: 'Ports',
      headerCell: () => 'Ports',
      cellComponent: KubernetesServicePortsComponent,
      cellFlex: '4'
    },
    createKubeAgeColumn()
  ];

  pageSizeOptions = defaultHelmKubeListPageSize;
  cardComponent = KubeServiceCardComponent;
  viewType = ListViewTypes.BOTH;
  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no services'
  };
  getDataSource: () => ListDataSource<KubeService>;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getMultiFiltersConfigs = () => [];
}
