import { TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import * as moment from 'moment';
import { of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import {
  BooleanIndicatorType,
} from '../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import {
  ITableListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import {
  TableCellBooleanIndicatorComponent,
  TableCellBooleanIndicatorComponentConfig,
} from '../../../../../../../core/src/shared/components/list/list-table/table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import {
  TableCellIconComponent,
  TableCellIconComponentConfig,
} from '../../../../../../../core/src/shared/components/list/list-table/table-cell-icon/table-cell-icon.component';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { CardCell } from '../../../../../../../core/src/shared/components/list/list.types';
import { kubeEntityCatalog } from '../../../kubernetes-entity-catalog';
import { Container, ContainerState, ContainerStatus, InitContainer, KubernetesPod } from '../../../store/kube.types';

export interface ContainerForTable {
  isInit: boolean;
  container: Container | InitContainer;
  containerStatus: ContainerStatus;
}

@Component({
  selector: 'app-kubernetes-pod-containers',
  templateUrl: './kubernetes-pod-containers.component.html',
  styleUrls: ['./kubernetes-pod-containers.component.scss'],
  providers: [
    TitleCasePipe
  ]
})
export class KubernetesPodContainersComponent extends CardCell<KubernetesPod> {

  @Input()
  set row(row: KubernetesPod) {
    if (!row || !!this.containerDataSource) {
      return;
    }
    const id = kubeEntityCatalog.pod.getSchema().getId(row);
    this.containerDataSource = {
      isTableLoading$: of(false),
      connect: () => kubeEntityCatalog.pod.store.getEntityMonitor(id).entity$.pipe(
        filter(pod => !!pod),
        map(pod => this.map(pod)),
      ),
      disconnect: () => { },
      trackBy: (index, container: ContainerForTable) => container.container.name,
    };
  }

  constructor(
    private titleCase: TitleCasePipe,
  ) {
    super();
  }

  private readyBoolConfig: TableCellBooleanIndicatorComponentConfig<ContainerForTable> = {
    isEnabled: (row: ContainerForTable) => row.containerStatus.ready,
    type: BooleanIndicatorType.yesNo,
    subtle: false,
    showText: false
  };

  private iconConfig: TableCellIconComponentConfig<ContainerForTable> = {
    getIcon: (row: ContainerForTable) => row.isInit ?
      {
        icon: 'border_clear',
        font: '',
        tooltip: 'Init Container'
      } : {
        icon: 'border_outer',
        font: '',
        tooltip: 'Container'
      },
  };

  public containerDataSource: ITableListDataSource<ContainerForTable>;
  public columns: ITableColumn<ContainerForTable>[] = [
    {
      columnId: 'icon',
      headerCell: () => '',
      cellComponent: TableCellIconComponent,
      cellConfig: this.iconConfig,
      cellFlex: '0 0 53px',
    },
    {
      columnId: 'name',
      headerCell: () => 'Container Name',
      cellDefinition: {
        valuePath: 'container.name'
      },
      cellFlex: '2',
    },
    {
      columnId: 'image',
      headerCell: () => 'Image',
      cellDefinition: {
        valuePath: 'container.image'
      },
      cellFlex: '3',
    },
    {
      columnId: 'ready',
      headerCell: () => 'Ready',
      cellComponent: TableCellBooleanIndicatorComponent,
      cellConfig: this.readyBoolConfig,
      cellFlex: '1',
    },
    {
      columnId: 'status',
      headerCell: () => 'State',
      cellDefinition: {
        getValue: cft => {
          if (!cft.containerStatus.state) {
            return 'Unknown';
          }
          const entries = Object.entries(cft.containerStatus.state);
          if (!entries.length) {
            return 'Unknown';
          }
          const sorted = entries.sort((a, b) => {
            const aStarted = moment(a[1].startedAt);
            const bStarted = moment(b[1].startedAt);

            return aStarted.isBefore(bStarted) ? -1 :
              aStarted.isAfter(bStarted) ? 1 : 0;

          });
          return this.containerStatusToString(sorted[0][0], sorted[0][1]);
        }
      },
      cellFlex: '2'
    },
    {
      columnId: 'restarts',
      headerCell: () => 'Restarts',
      cellDefinition: {
        getValue: cft => cft.containerStatus.restartCount.toString()
      },
      cellFlex: '1',
    },
    {
      columnId: 'probes',
      headerCell: () => 'Probes (L:R)',
      cellDefinition: {
        getValue: cft => {
          if (cft.isInit) {
            return '';
          }
          const container: Container = cft.container as Container;
          return cft.isInit ? '' : `${container.livenessProbe ? 'on' : 'off'}:${container.readinessProbe ? 'on' : 'off'}`;
        }
      },
      cellFlex: '1',
    },
  ];

  private map(row: KubernetesPod): ContainerForTable[] {
    const containerStatus = row.status.containerStatuses || [];
    const initContainerStatuses = row.status.initContainerStatuses || [];
    const containerStatusWithContainers: ContainerForTable[] = [
      ...containerStatus.map(c => this.createContainerForTable(c, row.spec.containers)),
      ...initContainerStatuses.map(c => this.createContainerForTable(c, row.spec.initContainers, true))
    ];
    return containerStatusWithContainers.sort((a, b) => a.container.name.localeCompare(b.container.name));
  }

  private createContainerForTable(containerStatus: ContainerStatus, containers: (Container | InitContainer)[], isInit = false):
    ContainerForTable {
    const containerForTable: ContainerForTable = {
      isInit,
      containerStatus,
      container: containers.find(c => c.name === containerStatus.name)
    };
    return containerForTable;
  }

  private containerStatusToString(state: string, status: ContainerState): string {
    const exitCode = status.exitCode ? `:${status.exitCode}` : '';
    const signal = status.signal ? `:${status.signal}` : '';
    const reason = status.reason ? ` (${status.reason}${exitCode || signal})` : '';
    return `${this.titleCase.transform(state)}${reason}`;
  }
}
