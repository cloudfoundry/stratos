import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
  selector: 'app-kube-config-table-import-status',
  templateUrl: './kube-config-table-import-status.component.html',
  styleUrls: ['./kube-config-table-import-status.component.scss']
})
export class KubeConfigTableImportStatusComponent extends TableCellCustom<KubeConfigFileCluster> {

  public state: Observable<any>;

  constructor() {
    super();
  }

  @Input()
  set config(element) {
    if (!this.state) {
      this.state = element(this.row);
    }
  }
}
