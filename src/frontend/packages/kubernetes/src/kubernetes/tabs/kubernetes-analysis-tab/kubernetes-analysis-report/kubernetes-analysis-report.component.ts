import {Component, type OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import type { IHeaderBreadcrumbLink } from '@stratosui/core';
import { type Observable, of, Subject } from 'rxjs';
import { catchError, first, map, startWith } from 'rxjs/operators';

import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { getParentURL } from '../../../services/route.helper';
import { PageSubNavComponent } from '@stratosui/core';
import { LoadingPageComponent } from '@stratosui/core';
import { AnalysisReportViewerComponent } from '../../../analysis-report-viewer/analysis-report-viewer.component';
import type { AnalysisReport } from '../../../store/kube.types';

interface ErrorMessage {
  firstLine: string;
}

@Component({
  selector: 'app-kubernetes-analysis-report',
  templateUrl: './kubernetes-analysis-report.component.html',
  styleUrls: ['./kubernetes-analysis-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageSubNavComponent,
    LoadingPageComponent,
    AnalysisReportViewerComponent
  ]
})
export class KubernetesAnalysisReportComponent implements OnInit {

  report$: Observable<AnalysisReport | false>;
  private errorMsg = new Subject<string | ErrorMessage>();
  errorMsg$ = this.errorMsg.pipe(startWith(''));
  isLoading$: Observable<boolean>;

  endpointID: string;
  id: string;

  // Signal for tracking breadcrumbs
  private breadcrumbsSignal = signal<IHeaderBreadcrumbLink[]>([
    { value: 'Analysis', routerLink: '' },
    { value: 'Report' },
  ]);
  public breadcrumbs$ = toObservable(this.breadcrumbsSignal);  private analysisService = inject(KubernetesAnalysisService);
  private route = inject(ActivatedRoute);
  private kubeEndpointService = inject(KubernetesEndpointService);



  constructor() {


    this.id = this.route.snapshot.params.id;

    // Initialize breadcrumbs with actual route
    this.breadcrumbsSignal.set([
      { value: 'Analysis', routerLink: getParentURL(this.route, 2) },
      { value: 'Report' },
    ]);


  }

  ngOnInit() {
    if (!this.id) {
      return;
    }

    this.report$ = this.analysisService.getByID(this.kubeEndpointService.baseKube.guid, this.id).pipe(
      map((response: AnalysisReport) => {
        if (!response.type) {
          this.error();
          return false as const;
        }
        this.errorMsg.next('');
        return response;
      }),
      catchError((_e, _c) => {
        this.error();
        return of(false as const);
      })
    );

    this.isLoading$ = this.report$.pipe(
      map(() => false),
      startWith(true)
    );

    // When the report has loaded, update the name in the breadcrumbs
    this.report$.pipe(first()).subscribe(report => {
      if (report && typeof report === 'object' && 'name' in report) {
        this.breadcrumbsSignal.set([
          { value: 'Analysis', routerLink: getParentURL(this.route, 2) },
          { value: report.name },
        ]);
      }
    });
  }

  error() {
    const msg: ErrorMessage = { firstLine: 'Failed to load Analysis Report' };
    this.errorMsg.next(msg);
  }
}


