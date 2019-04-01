import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../shared/components/list/list.component.types';
import {
  KubernetesServicePortsComponent,
} from '../../helm/list-types/kubernetes-service-ports/kubernetes-service-ports.component';
import { KubeService } from '../store/kube.types';


export abstract class BaseKubernetesServicesListConfig implements IListConfig<KubeService> {
  columns: Array<ITableColumn<KubeService>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        valuePath: 'metadata.name'
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'metadata.name'
      },
      cellFlex: '4',
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
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    filter: 'Filter by Name',
    noEntries: 'There are no services'
  };

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource: () => ListDataSource<KubeService>;
  getMultiFiltersConfigs = () => [];

  constructor(
  ) {
  }

}
