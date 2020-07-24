import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { AnalysisReport } from '../../store/kube.types';

@Component({
  selector: 'app-analysis-report-selector',
  templateUrl: './analysis-report-selector.component.html',
  styleUrls: ['./analysis-report-selector.component.scss']
})
export class AnalysisReportSelectorComponent implements OnInit, OnDestroy {

  public selection = { title: 'None' };

  public canShow$: Observable<boolean>;
  public analyzers$: Observable<AnalysisReport[]>;

  @Input() endpoint;
  @Input() path;
  @Input() prompt = 'Overlay Analysis';
  @Input() allowNone = true;
  @Input() autoSelect;

  @Output() selected = new EventEmitter<any>();
  @Output() reportCount = new EventEmitter<number>();

  autoSelected = false;

  subs: Subscription[] = [];

  constructor(public analysisService: KubernetesAnalysisService) {
    this.canShow$ = analysisService.hideAnalysis$.pipe(map(h => !h));
  }

  ngOnInit() {
    this.analyzers$ = this.analysisService.getByPath(this.endpoint, this.path).pipe(
      map(reports => {
        const res = [];
        if (this.allowNone) {
          res.push({ title: 'None' });
        }
        if (reports) {
          reports.forEach(r => {
            const c = { ...r };
            const title = c.type.substr(0, 1).toUpperCase() + c.type.substr(1);
            const age = moment(c.created).fromNow(true);
            c.title = `${title} (${age})`;
            res.push(c);
          });
        }
        this.reportCount.next(res.length);
        return res;
      }),
      tap(reports => {
        if (!this.autoSelected && this.autoSelect && reports.length > 0) {
          this.onSelected(reports[0]);
        }
      })
    )
  }


  // Selection changed
  public onSelected(d) {
    this.selection = d;
    if (!d.id) {
      this.selected.emit(null);
    } else {
      this.selected.next(d);
    }
  }

  public refreshReports($event: MouseEvent) {
    this.analysisService.getByPath(this.endpoint, this.path, true)
    $event.preventDefault();
    $event.cancelBubble = true;
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs)
  }

}
