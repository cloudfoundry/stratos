import { ChangeDetectionStrategy, Component} from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import type { PreviewableComponent } from '@stratosui/core';
import type { Observable } from 'rxjs';

import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { AnalysisInfoCardComponent } from './analysis-info-card/analysis-info-card.component';
import { SidepanelPreviewComponent } from '@stratosui/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-analysis-info',
  templateUrl: './kubernetes-analysis-info.component.html',
  styleUrls: ['./kubernetes-analysis-info.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    AnalysisInfoCardComponent,
    SidepanelPreviewComponent
  ],
  providers: [
    KubernetesAnalysisService
  ]
})
export class KubernetesAnalysisInfoComponent implements PreviewableComponent {

  analyzers$: Observable<unknown>;

  setProps(props: { [key: string]: unknown }) {
    this.analyzers$ = props.analyzers$ as Observable<unknown>;
  }
}
