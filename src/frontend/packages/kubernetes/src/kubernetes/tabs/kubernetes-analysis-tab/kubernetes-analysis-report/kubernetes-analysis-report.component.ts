import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, startWith, take } from 'rxjs/operators';

import {
  IHeaderBreadcrumbLink,
  LoadingPageComponent,
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
    AnalysisReportViewerComponent,
  ],
})
export class KubernetesAnalysisReportComponent implements OnInit {
  // strict: assigned in ngOnInit; the route guarantees the :id param so the
  // defensive early-return for a missing id is not reached in practice
  report$!: Observable<AnalysisReport | false>;
  isLoading$!: Observable<boolean>;

  private errorMsg = new Subject<{ firstLine: string; secondLine?: string } | string>();
  errorMsg$ = this.errorMsg.pipe(startWith(''));

  endpointID?: string;
  id: string;

  private breadcrumbsSignal = signal<IHeaderBreadcrumbLink[]>([
    { value: 'Analysis', routerLink: '' },
    { value: 'Report' },
  ]);
  public breadcrumbs$ = toObservable(this.breadcrumbsSignal);

  private analysisData = inject(KubeAnalysisDataService);
  private route = inject(ActivatedRoute);
  private kubeEndpointService = inject(KubernetesEndpointService);

  constructor() {
    this.id = this.route.snapshot.params.id;
    this.breadcrumbsSignal.set([
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
      map((report: AnalysisReport): AnalysisReport | false => {
        if (!report || !report.type) {
          this.error();
          return false;
        }
        this.errorMsg.next('');
        return report;
      }),
      catchError(() => {
        this.error();
        return of<false>(false);
      }),
    );

    this.isLoading$ = this.report$.pipe(
      map(() => false),
      startWith(true),
    );

    // Update the breadcrumbs once the report has resolved so the trail
    // shows the report name rather than the static "Report" label.
    this.report$.pipe(take(1)).subscribe((report) => {
      if (report && typeof report !== 'boolean') {
        this.breadcrumbsSignal.set([
          { value: 'Analysis', routerLink: getParentURL(this.route, 2) },
          { value: report.name },
        ]);
      }
    });
  }

  error() {
    this.errorMsg.next({ firstLine: 'Failed to load Analysis Report' });
  }
}
