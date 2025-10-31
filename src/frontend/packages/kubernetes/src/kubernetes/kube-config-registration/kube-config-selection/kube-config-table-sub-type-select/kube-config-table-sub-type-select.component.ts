import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '../../../../../../core/src/shared/components/custom-select/custom-select.component';

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
    CustomSelectComponent,
    CustomOptionComponent,
  ]
})
export class KubeConfigTableSubTypeSelectComponent extends TableCellCustom<KubeConfigFileCluster> implements OnInit {

  selected: string;

  subTypes: Array<{ id: string; name: string }>;
  private helper = inject(KubeConfigHelper);

  constructor() {
    super();

    this.subTypes = new KubeConfigAuthHelper().subTypes;
  }

  ngOnInit() {
    this.selected = this.row._subType || '';
  }

  valueChanged(value: string): void {
    this.row._subType = value;
    this.helper.update(this.row);
  }
}
