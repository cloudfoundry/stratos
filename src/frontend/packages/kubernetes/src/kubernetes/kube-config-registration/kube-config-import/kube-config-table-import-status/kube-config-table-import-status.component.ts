import { ChangeDetectionStrategy, Component, Input} from '@angular/core';

import { Observable } from 'rxjs';

import {
  IActionMonitorComponentState,
  AppActionMonitorIconComponent,
} from '../../../../../../core/src/shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kube-config-table-import-status',
  templateUrl: './kube-config-table-import-status.component.html',
  styleUrls: ['./kube-config-table-import-status.component.scss'],
  standalone: true,
  imports: [
    AppActionMonitorIconComponent
]
})
export class KubeConfigTableImportStatusComponent extends TableCellCustom<KubeConfigFileCluster> {

  public state: Observable<IActionMonitorComponentState>;

  @Input()
  set config(element: (row: KubeConfigFileCluster) => Observable<IActionMonitorComponentState>) {
    super.config = element;
    if (!this.state) {
      this.state = element(this.row);
    }
  }
}
