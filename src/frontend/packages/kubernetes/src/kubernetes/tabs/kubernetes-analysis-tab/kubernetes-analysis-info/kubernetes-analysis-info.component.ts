import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PreviewableComponent } from '@stratosui/core';

import { KubernetesAnalysisService, KubernetesAnalysisType } from '../../../services/kubernetes.analysis.service';
import { AnalysisInfoCardComponent } from './analysis-info-card/analysis-info-card.component';
import { SidepanelPreviewComponent } from '@stratosui/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-analysis-info',
  templateUrl: './kubernetes-analysis-info.component.html',
  standalone: true,
  imports: [
    AnalysisInfoCardComponent,
    SidepanelPreviewComponent
  ],
  providers: [
    KubernetesAnalysisService
  ]
})
export class KubernetesAnalysisInfoComponent implements PreviewableComponent {

  readonly analyzers = signal<KubernetesAnalysisType[]>([]);

  setProps(props: { [key: string]: any, }) {
    this.analyzers.set(props.analyzers ?? []);
  }
}
