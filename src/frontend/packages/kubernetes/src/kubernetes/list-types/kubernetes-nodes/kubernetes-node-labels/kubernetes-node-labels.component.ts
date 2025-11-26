import { ChangeDetectionStrategy, Component, type OnInit} from '@angular/core';
import { CustomTooltipDirective, TableCellCustom } from '@stratosui/core';
import type { KubernetesNode } from '../../../store/kube.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-labels',
  templateUrl: './kubernetes-node-labels.component.html',
  styleUrls: ['./kubernetes-node-labels.component.scss'],
  standalone: true,
  imports: [
    CustomTooltipDirective,
  ]
})
export class KubernetesNodeLabelsComponent extends TableCellCustom<KubernetesNode> implements OnInit {

  labels: string;

  ngOnInit() {
    this.labels = Object.entries(this.row.metadata.labels)
      .map(([key, value]) => `${key}:${value}`)
      .join(', ');
  }

}
