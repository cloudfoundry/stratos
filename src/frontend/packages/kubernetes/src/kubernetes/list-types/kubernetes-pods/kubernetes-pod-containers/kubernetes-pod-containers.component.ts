import { AsyncPipe, TitleCasePipe } from '@angular/common';
import {Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { isBefore, isAfter } from 'date-fns';
import type { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { CardCell, CustomTooltipDirective } from '@stratosui/core';
import { kubeEntityCatalog } from '../../../kubernetes-entity-generator';
import type { Container, ContainerState, ContainerStatus, InitContainer, KubernetesPod } from '../../../store/kube.types';

export interface ContainerForTable {
  isInit: boolean;
  container: Container | InitContainer;
  containerStatus: ContainerStatus;
  status: string;
}

@Component({
  selector: 'app-kubernetes-pod-containers',
  templateUrl: './kubernetes-pod-containers.component.html',
  styleUrls: ['./kubernetes-pod-containers.component.scss'],
  providers: [
    TitleCasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, CustomTooltipDirective]
})
export class KubernetesPodContainersComponent extends CardCell<KubernetesPod> {

  public containers$: Observable<ContainerForTable[]>;
  public icon = {
    false: {
      icon: 'container',
      font: 'stratos-icons',
      tooltip: 'Container'
    },
    true: {
      icon: 'border_clear',
      font: '',
      tooltip: 'Init Container'
    }
  };

  @Input()
  set row(row: KubernetesPod) {
    super.row = row;
    if (!row || !!this.containers$) {
      return;
    }
    const id = kubeEntityCatalog.pod.getSchema().getId(row);
    this.containers$ = kubeEntityCatalog.pod.store.getEntityMonitor(id).entity$.pipe(
      filter(pod => !!pod),
      map(pod => this.map(pod)),
    );
  }
  get row(): KubernetesPod {
    return super.row;
  }  private titleCase = inject(TitleCasePipe);

  private getState(containerStatus: ContainerStatus) {
    if (!containerStatus.state) {
      return 'Unknown';
    }
    const entries = Object.entries(containerStatus.state);
    if (!entries.length) {
      return 'Unknown';
    }
    const sorted = entries.sort((a, b) => {
      const aStarted = new Date(a[1].startedAt);
      const bStarted = new Date(b[1].startedAt);

      return isBefore(aStarted, bStarted) ? -1 :
        isAfter(aStarted, bStarted) ? 1 : 0;

    });
    return this.containerStatusToString(sorted[0][0], sorted[0][1]);
  }

  private map(row: KubernetesPod): ContainerForTable[] {
    const containerStatus = row.status.containerStatuses || [];
    const initContainerStatuses = row.status.initContainerStatuses || [];
    const containerStatusWithContainers: ContainerForTable[] = [
      ...containerStatus.map(c => this.createContainerForTable(c, row.spec.containers)),
      ...initContainerStatuses.map(c => this.createContainerForTable(c, row.spec.initContainers, true))
    ];
    return containerStatusWithContainers.sort((a, b) => a.container.name.localeCompare(b.container.name));
  }

  private containerStatusToString(state: string, status: ContainerState): string {
    const exitCode = status.exitCode ? `:${status.exitCode}` : '';
    const signal = status.signal ? `:${status.signal}` : '';
    const reason = status.reason ? ` (${status.reason}${exitCode || signal})` : '';
    return `${this.titleCase.transform(state)}${reason}`;
  }

  private createContainerForTable(containerStatus: ContainerStatus, containers: (Container | InitContainer)[], isInit = false):
    ContainerForTable {
    const containerForTable: ContainerForTable = {
      isInit,
      containerStatus,
      container: containers.find(c => c.name === containerStatus.name),
      status: this.getState(containerStatus)
    };
    return containerForTable;
  }

}
