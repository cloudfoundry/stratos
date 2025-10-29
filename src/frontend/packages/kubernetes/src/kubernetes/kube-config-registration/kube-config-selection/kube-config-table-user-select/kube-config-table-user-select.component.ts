import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CustomSelectComponent, CustomOptionComponent } from '../../../../../../core/src/shared/components/custom-select/custom-select.component';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
selector: 'app-kube-config-table-user-select',
  templateUrl: './kube-config-table-user-select.component.html',
  styleUrls: ['./kube-config-table-user-select.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    CustomSelectComponent,
    CustomOptionComponent,
  ]
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

  valueChanged(value: string): void {
    this.row._user = value;
    this.helper.update(this.row);
  }

}
