import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';

import { type AppChip, AppChipsComponent, TableCellCustom } from '@stratosui/core';
import type { KubeAPIResource } from '../../store/kube.types';


@Component({
  selector: 'app-kubernetes-labels-cell',
  templateUrl: './kubernetes-labels-cell.component.html',
  styleUrls: ['./kubernetes-labels-cell.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppChipsComponent]
})
export class KubernetesLabelsCellComponent extends TableCellCustom<KubeAPIResource> implements OnInit {

  chipsConfig: AppChip<KubeAPIResource>[];

  ngOnInit() {
    this.chipsConfig = Object.entries(this.row.metadata.labels).map(([key, value]) => ({
      value: `${key}:${value}`
    }));
  }
}
