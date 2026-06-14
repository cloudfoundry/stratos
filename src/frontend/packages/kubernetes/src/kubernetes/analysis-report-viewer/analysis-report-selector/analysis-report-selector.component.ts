import { AsyncPipe } from '@angular/common';
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { formatDistance } from 'date-fns';
import { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { AnalysisReport } from '../../store/kube.types';

@Component({
selector: 'app-analysis-report-selector',
  templateUrl: './analysis-report-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe
]
})
export class AnalysisReportSelectorComponent implements OnInit, OnDestroy {

  public selection = { title: 'None' };

  public canShow$: Observable<boolean>;
  // strict: assigned in ngOnInit before the template's async pipe reads it
  public analyzers$!: Observable<AnalysisReport[]>;

  @Input() endpoint!: string;
  @Input() path!: string;
  @Input() prompt = 'Overlay';
  @Input() allowNone = true;
  @Input() autoSelect = false;

  @Output() selected = new EventEmitter<AnalysisReport | null>();
  @Output() reportCount = new EventEmitter<number>();

  autoSelected = false;
  isMenuOpen = false;

  subs: Subscription[] = [];
  public analysisService = inject(KubernetesAnalysisService);



  constructor() {


    this.canShow$ = this.analysisService.hideAnalysis$.pipe(map(h => !h));


  }

  ngOnInit() {
    this.analyzers$ = this.analysisService.getByPath(this.endpoint, this.path, true).pipe(
      map((reports: AnalysisReport[]) => {
        const res: Array<AnalysisReport | { title: string }> = [];
        if (this.allowNone) {
          res.push({ title: 'None' });
        }
        if (reports) {
          reports.forEach((r: AnalysisReport) => {
            const c: AnalysisReport & { title?: string } = { ...r };
            const title = c.type.substr(0, 1).toUpperCase() + c.type.substr(1);
            const age = formatDistance(new Date(c.created), new Date());
            c.title = `${title} (${age})`;
            res.push(c);
          });
        }
        this.reportCount.next(res.length);
        return res as AnalysisReport[];
      }),
      tap((reports: AnalysisReport[]) => {
        if (!this.autoSelected && this.autoSelect && reports.length > 0) {
          this.onSelected(reports[0]);
        }
      })
    );
  }


  // Selection changed
  public onSelected(d: AnalysisReport | { title: string; id?: string }): void {
    this.selection = d as { title: string };
    if (!('id' in d) || !d.id) {
      this.selected.emit(null);
    } else {
      this.selected.next(d as AnalysisReport);
    }
  }

  public refreshReports($event: MouseEvent) {
    this.analysisService.getByPath(this.endpoint, this.path, true);
    $event.preventDefault();
    $event.cancelBubble = true;
  }

  public toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  public closeMenu() {
    this.isMenuOpen = false;
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }

}
