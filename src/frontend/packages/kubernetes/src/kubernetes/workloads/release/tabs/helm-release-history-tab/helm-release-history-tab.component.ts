import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { format } from 'date-fns';
import { type Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { TableComponent, type ITableListDataSource, type ITableColumn } from '@stratosui/core';
import type { HelmReleaseRevision } from '../../../workload.types';
import { HelmReleaseHelperService } from './../helm-release-helper.service';

class HelmReleaseHistoryDataSource implements ITableListDataSource<HelmReleaseRevision> {
  constructor(
    private data$: Observable<HelmReleaseRevision[]>,
    public isTableLoading$: Observable<boolean>
  ) {}

  connect(): Observable<HelmReleaseRevision[]> {
    return this.data$;
  }

  disconnect(): void {}

  trackBy(_index: number, item: HelmReleaseRevision): number {
    return item.revision;
  }

  getRowState(_row: HelmReleaseRevision): Observable<Record<string, unknown>> {
    return of({});
  }
}

@Component({
  selector: 'app-helm-release-history-tab',
  templateUrl: './helm-release-history-tab.component.html',
  styleUrls: ['./helm-release-history-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TableComponent
  ]
})
export class HelmReleaseHistoryTabComponent {

  public columns: ITableColumn<HelmReleaseRevision>[] = [];

  public dataSource: ITableListDataSource<HelmReleaseRevision>;
  public helmReleaseHelper = inject(HelmReleaseHelperService);



  constructor() {


    // Use the ame column layout as the Helm CLI
    this.columns = [
      {
        columnId: 'revision',
        headerCell: () => 'Revision',
        cellFlex: '1',
        cellDefinition: {
          valuePath: 'revision'
        }
      },
      {
        columnId: 'updated',
        headerCell: () => 'Updated',
        cellFlex: '3',
        cellDefinition: {
          getValue: row => format(new Date(row.last_deployed), 'PPPppp')
        }
      },
      {
        columnId: 'status',
        headerCell: () => 'Status',
        cellFlex: '2',
        cellDefinition: {
          valuePath: 'status'
        }
      },
      {
        columnId: 'chart',
        headerCell: () => 'Chart',
        cellFlex: '2',
        cellDefinition: {
          getValue: row => `${row.chart.name}-${row.chart.version}`
        }
      },
      {
        columnId: 'app_version',
        headerCell: () => 'App Version',
        cellFlex: '1',
        cellDefinition: {
          valuePath: 'chart.appVersion'
        }
      },
      {
        columnId: 'description',
        headerCell: () => 'Description',
        cellFlex: '2',
        cellDefinition: {
          valuePath: 'description'
        }
      },
    ];

    const data$ = this.helmReleaseHelper.fetchReleaseHistory().pipe(
      map(history => [...history].sort((a, b) => b.revision - a.revision))
    );

    const isTableLoading$ = data$.pipe(
      map(revisions => !revisions),
      startWith(true),
    );

    this.dataSource = new HelmReleaseHistoryDataSource(data$, isTableLoading$);


  }

}
