import { Component } from '@angular/core';
import { PreviewableComponent } from 'frontend/packages/core/src/shared/previewable-component';
import { Observable } from 'rxjs';

import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';


@Component({
  selector: 'app-kubernetes-analysis-info',
  templateUrl: './kubernetes-analysis-info.component.html',
  styleUrls: ['./kubernetes-analysis-info.component.scss'],
  providers: [
    KubernetesAnalysisService
  ]
})
export class KubernetesAnalysisInfoComponent implements PreviewableComponent {

  analyzers$: Observable<any>;

  setProps(props: { [key: string]: any; }) {
    this.analyzers$ = props.analyzers$;
  }
}
