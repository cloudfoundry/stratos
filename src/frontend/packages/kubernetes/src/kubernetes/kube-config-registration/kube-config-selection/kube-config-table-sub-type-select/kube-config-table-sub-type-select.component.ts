import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigAuthHelper } from '../../kube-config-auth.helper';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
selector: 'app-kube-config-table-sub-type-select',
  templateUrl: './kube-config-table-sub-type-select.component.html',
  styleUrls: ['./kube-config-table-sub-type-select.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ]
})
export class KubeConfigTableSubTypeSelectComponent extends TableCellCustom<KubeConfigFileCluster> implements OnInit {

  selected: string;

  subTypes: string[];

  constructor(private helper: KubeConfigHelper) {
    super();

    this.subTypes = new KubeConfigAuthHelper().subTypes;
  }

  ngOnInit() {
    this.selected = this.row._subType || '';
  }

  valueChanged(value) {
    this.row._subType = value;
    this.helper.update(this.row);
  }
}
