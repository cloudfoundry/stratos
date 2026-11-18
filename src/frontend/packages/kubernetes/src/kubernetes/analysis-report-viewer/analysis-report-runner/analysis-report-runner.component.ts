import { Component, computed, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { SidePanelService } from '@stratosui/core';

import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import {
  KubernetesAnalysisInfoComponent,
} from '../../tabs/kubernetes-analysis-tab/kubernetes-analysis-info/kubernetes-analysis-info.component';

@Component({
selector: 'app-analysis-report-runner',
  templateUrl: './analysis-report-runner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class AnalysisReportRunnerComponent {

  menuOpen = false;
  // Every host binds the endpoint the analysis runs against.
  readonly kubeId = input.required<string>();
  readonly namespace = input<string>();
  readonly app = input<string>();
  public analysisService = inject(KubernetesAnalysisService);
  private sidePanelService = inject(SidePanelService);

  readonly canShow = computed(() => !this.analysisService.hideAnalysis());
  // A namespace runs only the namespace-aware analyzers (null while
  // analysis is off).
  readonly analyzers = computed(() =>
    this.namespace() ? this.analysisService.namespaceAnalyzers() : this.analysisService.analyzers());

  public runAnalysis(id: string) {
    this.analysisService.run(id, this.kubeId(), this.namespace(), this.app());
  }

  showAnalyzersInfo() {
    this.sidePanelService.showModal(KubernetesAnalysisInfoComponent, {
      analyzers: this.analysisService.analyzers()
    });
  }

}
