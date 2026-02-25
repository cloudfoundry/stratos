import { ChangeDetectionStrategy, Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewableComponent } from '@stratosui/core';
import { Observable } from 'rxjs';

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

  analyzers$: Observable<any>;

  setProps(props: { [key: string]: any, }) {
    this.analyzers$ = props.analyzers$;
  }
}
