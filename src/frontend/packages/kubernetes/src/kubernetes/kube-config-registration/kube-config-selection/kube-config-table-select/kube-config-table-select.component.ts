import { Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
selector: 'app-kube-config-table-select',
  templateUrl: './kube-config-table-select.component.html',
  styleUrls: ['./kube-config-table-select.component.scss'],
  standalone: true,
  imports: [
    MatCheckboxModule,
  ]
})
export class KubeConfigTableSelectComponent extends TableCellCustom<KubeConfigFileCluster> {

  constructor(private helper: KubeConfigHelper) {
    super();
  }
  changed(v: { checked: boolean }): void {
    this.row._selected = v.checked;
    this.helper.update(this.row);
  }

}
