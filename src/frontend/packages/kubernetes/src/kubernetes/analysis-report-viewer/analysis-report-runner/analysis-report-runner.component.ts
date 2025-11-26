import { AsyncPipe } from '@angular/common';
import {Component, Input, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { SidePanelService } from '@stratosui/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { KubernetesAnalysisService, type KubernetesAnalysisType } from '../../services/kubernetes.analysis.service';
import {
  KubernetesAnalysisInfoComponent,
} from '../../tabs/kubernetes-analysis-tab/kubernetes-analysis-info/kubernetes-analysis-info.component';

@Component({
selector: 'app-analysis-report-runner',
  templateUrl: './analysis-report-runner.component.html',
  styleUrls: ['./analysis-report-runner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe
  ]
})
export class AnalysisReportRunnerComponent implements OnInit {

  canShow$: Observable<boolean>;
  analyzers$: Observable<KubernetesAnalysisType[]>;
  menuOpen = false;
  @Input() kubeId!: string;
  @Input() namespace!: string;
  @Input() app!: string;
  public analysisService = inject(KubernetesAnalysisService);
  private sidePanelService = inject(SidePanelService);



  constructor() {


    this.canShow$ = this.analysisService.hideAnalysis$.pipe(map(h => !h));


  }

  public runAnalysis(id: string) {
    this.analysisService.run(id, this.kubeId, this.namespace, this.app);
  }

  ngOnInit(): void {
    if (this.namespace) {
      this.analyzers$ = this.analysisService.namespaceAnalyzers$;
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
