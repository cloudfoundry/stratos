import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHeaderBreadcrumbLink } from 'frontend/packages/core/src/shared/components/page-header/page-header.types';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, first, map, startWith } from 'rxjs/operators';

import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { getParentURL } from '../../../services/route.helper';

@Component({
  selector: 'app-kubernetes-analysis-report',
  templateUrl: './kubernetes-analysis-report.component.html',
  styleUrls: ['./kubernetes-analysis-report.component.scss']
})
export class KubernetesAnalysisReportComponent implements OnInit {

  report$: Observable<any>;
  private errorMsg = new Subject<any>();
  errorMsg$ = this.errorMsg.pipe(startWith(''));
  isLoading$: Observable<boolean>;

  endpointID: string;
  id: string;

  private breadcrumbsSubject: BehaviorSubject<IHeaderBreadcrumbLink[]>;
  public breadcrumbs$: Observable<IHeaderBreadcrumbLink[]>;

  constructor(
    private analysisService: KubernetesAnalysisService,
    private route: ActivatedRoute,
    private kubeEndpointService: KubernetesEndpointService,
  ) {
    this.id = route.snapshot.params.id;

    this.breadcrumbsSubject = new BehaviorSubject<IHeaderBreadcrumbLink[]>(undefined);
    this.breadcrumbs$ = this.breadcrumbsSubject.asObservable();
    this.breadcrumbsSubject.next([
      { value: 'Analysis', routerLink: getParentURL(route, 2) },
      { value: 'Report' },
    ]);
  }

  ngOnInit() {
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
      this.breadcrumbsSubject.next([
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


