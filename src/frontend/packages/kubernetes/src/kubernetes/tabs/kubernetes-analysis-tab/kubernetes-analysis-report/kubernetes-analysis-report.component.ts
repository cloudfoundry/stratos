import {Component, OnInit, signal, inject} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IHeaderBreadcrumbLink } from 'frontend/packages/core/src/shared/components/page-header/page-header.types';
import { Observable, of, Subject } from 'rxjs';
import { catchError, first, map, startWith } from 'rxjs/operators';

import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { getParentURL } from '../../../services/route.helper';
import { PageHeaderModule } from 'frontend/packages/core/src/shared/components/page-header/page-header.module';
import { PageSubNavComponent } from 'frontend/packages/core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { LoadingPageComponent } from 'frontend/packages/core/src/shared/components/loading-page/loading-page.component';
import { AnalysisReportViewerComponent } from '../../../analysis-report-viewer/analysis-report-viewer.component';

@Component({
  selector: 'app-kubernetes-analysis-report',
  templateUrl: './kubernetes-analysis-report.component.html',
  styleUrls: ['./kubernetes-analysis-report.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderModule,
    PageSubNavComponent,
    LoadingPageComponent,
    AnalysisReportViewerComponent
  ]
})
export class KubernetesAnalysisReportComponent implements OnInit {

  report$: Observable<any>;
  private errorMsg = new Subject<any>();
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
      map((response: any) => {
        if (!response.type) {
          this.error();
          return false;
        }
        this.errorMsg.next('');
        return response;
      }),
      catchError((e, c) => {
        this.error();
        return of(false);
      })
    );

    this.isLoading$ = this.report$.pipe(
      map(() => false),
      startWith(true)
    );

    // When the report has loaded, update the name in the breadcrumbs
    this.report$.pipe(first()).subscribe(report => {
      this.breadcrumbsSignal.set([
        { value: 'Analysis', routerLink: getParentURL(this.route, 2) },
        { value: report.name },
      ]);
    });
  }

  error() {
    const msg = { firstLine: 'Failed to load Analysis Report' };
    this.errorMsg.next(msg);
  }
}


