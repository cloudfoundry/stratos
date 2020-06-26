import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
  selector: 'app-kube-config-table-user-select',
  templateUrl: './kube-config-table-user-select.component.html',
  styleUrls: ['./kube-config-table-user-select.component.scss']
})
export class KubeConfigTableUserSelectComponent extends TableCellCustom<KubeConfigFileCluster> implements OnInit {

  hasUser = false;
  selected: string;

  constructor(private helper: KubeConfigHelper) {
    super();
  }

  ngOnInit() {
    this.selected = this.row._user || '';
    this.hasUser = this.row._users.length > 0;
  }

  valueChanged(value) {
    this.row._user = value;
    this.helper.update(this.row);
  }

}
