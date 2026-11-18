import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith, take } from 'rxjs/operators';

import {
  IHeaderBreadcrumbLink,
  LoadingPageComponent,
  NoContentMessageComponent,
  PageHeaderModule,
  PageSubNavComponent,
} from '@stratosui/core';

import { AnalysisReportViewerComponent } from '../../../analysis-report-viewer/analysis-report-viewer.component';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { getParentURL } from '../../../services/route.helper';
import { KubeAnalysisDataService } from '../../../../services/domain-data/kube-analysis-data.service';
import { AnalysisReport } from '../../../../services/endpoint-data/kube-types';

// Detail view for a single analysis report. Dropped the ngrx-backed
// `KubernetesAnalysisService.getByID()` path in favour of the signal-
// native `KubeAnalysisDataService.reportById()` which fetches via
// HttpClient directly and applies the per-format normalization
// helpers in-line. The component still renders into the legacy
// `<app-analysis-report-viewer>` so popeye/kubescore display logic is
// unchanged.
//
// `report$` remains an Observable so the existing async-pipe + loading
// chrome continue to work unchanged. We adapt the data-service's
// observable into the same emit shape the legacy `getByID` stream
// produced (single emission with the loaded report on success, false
// on failure).
@Component({
  selector: 'app-kubernetes-analysis-report',
  templateUrl: './kubernetes-analysis-report.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderModule,
    PageSubNavComponent,
    LoadingPageComponent,
    NoContentMessageComponent,
    AnalysisReportViewerComponent,
  ],
})
export class KubernetesAnalysisReportComponent implements OnInit {
  // strict: assigned in ngOnInit; the route guarantees the :id param so the
  // defensive early-return for a missing id is not reached in practice
  report$!: Observable<AnalysisReport | false>;
  isLoading$!: Observable<boolean>;

  // null = no error to show; the template's @if guard filters it out
  readonly errorMsg = signal<{ firstLine: string } | null>(null);

  endpointID?: string;
  id: string;

  readonly breadcrumbs = signal<IHeaderBreadcrumbLink[]>([
    { value: 'Analysis', routerLink: '' },
    { value: 'Report' },
  ]);

  private analysisData = inject(KubeAnalysisDataService);
  private route = inject(ActivatedRoute);
  private kubeEndpointService = inject(KubernetesEndpointService);

  constructor() {
    this.id = this.route.snapshot.params.id;
    this.breadcrumbs.set([
      { value: 'Analysis', routerLink: getParentURL(this.route, 2) },
      { value: 'Report' },
    ]);
  }

  ngOnInit() {
    if (!this.id) {
      return;
    }

    const kubeGuid = this.kubeEndpointService.baseKube.guid;

    this.report$ = this.analysisData.reportById(kubeGuid, this.id).pipe(
      map((report: AnalysisReport): AnalysisReport | false => report && report.type ? report : false),
      catchError(() => of<false>(false)),
    );

    this.isLoading$ = this.report$.pipe(
      map(() => false),
      startWith(true),
    );

    // Update the breadcrumbs once the report has resolved so the trail
    // shows the report name rather than the static "Report" label. A report
    // that did not load shows the error. This is the one place the error is
    // written: report$ is also read by the async pipe during rendering, where
    // a signal write is not allowed.
    this.report$.pipe(take(1)).subscribe((report) => {
      if (!report) {
        this.error();
        return;
      }
      this.errorMsg.set(null);
      this.breadcrumbs.set([
        { value: 'Analysis', routerLink: getParentURL(this.route, 2) },
        { value: report.name },
      ]);
    });
  }

  error() {
    this.errorMsg.set({ firstLine: 'Failed to load Analysis Report' });
  }
}
