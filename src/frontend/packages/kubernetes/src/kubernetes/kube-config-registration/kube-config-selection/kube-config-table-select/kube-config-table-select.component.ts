import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CustomCheckboxComponent, TableCellCustom } from '@stratosui/core';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
selector: 'app-kube-config-table-select',
  templateUrl: './kube-config-table-select.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CustomCheckboxComponent,
  ]
})
export class KubeConfigTableSelectComponent extends TableCellCustom<KubeConfigFileCluster> {

  private helper = inject(KubeConfigHelper);

  constructor() {
    super();
  }
  changed(v: { checked: boolean }): void {
    this.row._selected = v.checked;
    this.helper.update(this.row);
  }

}
