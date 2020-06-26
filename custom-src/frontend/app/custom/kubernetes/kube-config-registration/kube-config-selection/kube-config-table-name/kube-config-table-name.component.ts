import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubeConfigFileCluster } from '../../kube-config.types';

@Component({
  selector: 'app-kube-config-table-name',
  templateUrl: './kube-config-table-name.component.html',
  styleUrls: ['./kube-config-table-name.component.scss']
})
export class KubeConfigTableName extends TableCellCustom<KubeConfigFileCluster> { }
