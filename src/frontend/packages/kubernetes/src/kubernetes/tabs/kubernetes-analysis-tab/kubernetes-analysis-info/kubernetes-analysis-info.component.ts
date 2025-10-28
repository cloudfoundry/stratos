import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewableComponent } from 'frontend/packages/core/src/shared/previewable-component';
import { Observable } from 'rxjs';

import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { AnalysisInfoCardComponent } from './analysis-info-card/analysis-info-card.component';


@Component({
  selector: 'app-kubernetes-analysis-info',
  templateUrl: './kubernetes-analysis-info.component.html',
  styleUrls: ['./kubernetes-analysis-info.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    AnalysisInfoCardComponent
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
