import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { format } from 'date-fns';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { TableComponent } from '../../../../../../../core/src/shared/components/list/list-table/table.component';
import { ITableListDataSource } from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { HelmReleaseHelperService } from './../helm-release-helper.service';

class HelmReleaseHistoryDataSource implements ITableListDataSource<any> {
  constructor(
    private data$: Observable<any[]>,
    public isTableLoading$: Observable<boolean>
  ) {}

  connect(): Observable<any[]> {
    return this.data$;
  }

  disconnect(): void {}

  trackBy(index: number, item: any): any {
    return item.revision;
  }

  getRowState(row: any): Observable<any> {
    return of({});
  }
}

@Component({
  selector: 'app-helm-release-history-tab',
  templateUrl: './helm-release-history-tab.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TableComponent
  ]
})
export class HelmReleaseHistoryTabComponent {

  public columns: ITableColumn<any>[] = [];

  public dataSource: ITableListDataSource<any>;
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
