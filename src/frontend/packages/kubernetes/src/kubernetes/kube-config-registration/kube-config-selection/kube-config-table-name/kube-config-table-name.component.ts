import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
selector: 'app-kube-config-table-name',
  templateUrl: './kube-config-table-name.component.html',
  styleUrls: ['./kube-config-table-name.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
  ]
})
export class KubeConfigTableNameComponent extends TableCellCustom<KubeConfigFileCluster> { }
