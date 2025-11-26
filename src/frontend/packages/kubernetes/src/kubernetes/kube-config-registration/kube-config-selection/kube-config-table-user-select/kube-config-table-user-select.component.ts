import { Component, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '../../../../../../core/src/shared/components/custom-select/custom-select.component';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigHelper } from '../../kube-config.helper';
import type { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
selector: 'app-kube-config-table-user-select',
  templateUrl: './kube-config-table-user-select.component.html',
  styleUrls: ['./kube-config-table-user-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    CustomSelectComponent,
    CustomOptionComponent
]
})
export class KubeConfigTableUserSelectComponent extends TableCellCustom<KubeConfigFileCluster> implements OnInit {

  hasUser = false;
  selected: string;
  private helper = inject(KubeConfigHelper);

  ngOnInit() {
    this.selected = this.row._user || '';
    this.hasUser = this.row._users.length > 0;
  }

  valueChanged(value: string): void {
    this.row._user = value;
    this.helper.update(this.row);
  }

}
