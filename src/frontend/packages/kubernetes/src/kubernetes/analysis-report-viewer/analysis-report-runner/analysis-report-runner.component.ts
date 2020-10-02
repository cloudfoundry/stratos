import { Component, Input, OnInit } from '@angular/core';
import { SidePanelService } from 'frontend/packages/core/src/shared/services/side-panel.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { KubernetesAnalysisService, KubernetesAnalysisType } from '../../services/kubernetes.analysis.service';
import {
  KubernetesAnalysisInfoComponent,
} from '../../tabs/kubernetes-analysis-tab/kubernetes-analysis-info/kubernetes-analysis-info.component';

@Component({
  selector: 'app-analysis-report-runner',
  templateUrl: './analysis-report-runner.component.html',
  styleUrls: ['./analysis-report-runner.component.scss']
})
export class AnalysisReportRunnerComponent implements OnInit {

  canShow$: Observable<boolean>;
  analyzers$: Observable<KubernetesAnalysisType[]>;
  @Input() kubeId: string;
  @Input() namespace: string;
  @Input() app: string;

  constructor(
    public analysisService: KubernetesAnalysisService,
    private sidePanelService: SidePanelService,
  ) {
    this.canShow$ = analysisService.hideAnalysis$.pipe(map(h => !h));
  }

  public runAnalysis(id: string) {
    this.analysisService.run(id, this.kubeId, this.namespace, this.app);
  }

  ngOnInit(): void {
    if (this.namespace) {
      this.analyzers$ = this.analysisService.namespaceAnalyzers$
    } else {
      this.analyzers$ = this.analysisService.analyzers$;
    }
  }

  showAnalyzersInfo() {
    this.sidePanelService.showModal(KubernetesAnalysisInfoComponent, {
      analyzers$: this.analysisService.analyzers$
    });
  }

}
