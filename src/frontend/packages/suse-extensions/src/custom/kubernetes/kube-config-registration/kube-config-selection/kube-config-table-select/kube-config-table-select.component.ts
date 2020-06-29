import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
  selector: 'app-kube-config-table-select',
  templateUrl: './kube-config-table-select.component.html',
  styleUrls: ['./kube-config-table-select.component.scss']
})
export class KubeConfigTableSelectComponent extends TableCellCustom<KubeConfigFileCluster> {

  constructor(private helper: KubeConfigHelper) {
    super();
  }
  changed(v) {
    this.row._selected = v.checked;
    this.helper.update(this.row);
  }

}
