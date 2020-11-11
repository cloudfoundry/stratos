import { Component } from '@angular/core';
import moment from 'moment';
import { of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import {
  ITableListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { HelmReleaseHelperService } from './../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-history-tab',
  templateUrl: './helm-release-history-tab.component.html',
  styleUrls: ['./helm-release-history-tab.component.scss']
})
export class HelmReleaseHistoryTabComponent {

  public columns: ITableColumn<any>[] = [];

  public dataSource: ITableListDataSource<any>;

  constructor(public helmReleaseHelper: HelmReleaseHelperService) {

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
          getValue: row => moment(row.last_deployed).format('LLL')
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
    this.dataSource = {
      connect: () => data$,
      disconnect: () => { },
      trackBy: (index, item) => item.revision,
      isTableLoading$: data$.pipe(
        map(revisions => !revisions),
        startWith(true),
      ),
      getRowState: (row) => {
        return of({});
      }
    };
  }

}
