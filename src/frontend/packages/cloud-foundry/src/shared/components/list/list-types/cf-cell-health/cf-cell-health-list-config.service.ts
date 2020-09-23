/* tslint:disable:max-line-length */
import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, tap } from 'rxjs/operators';

import {
  BooleanIndicatorType,
} from '../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import {
  TableCellBooleanIndicatorComponent,
  TableCellBooleanIndicatorComponentConfig,
} from '../../../../../../../core/src/shared/components/list/list-table/table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { CFAppState } from '../../../../../cf-app-state';
import {
  CloudFoundryCellTabService,
} from '../../../../../features/cf/tabs/cf-cells/cloud-foundry-cell/cloud-foundry-cell-tab.service';
import { CfCellService } from '../../../../../features/container-orchestration/services/cf-cell.service';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellHealthDataSource, CfCellHealthEntry, CfCellHealthState } from './cf-cell-health-source';


// tslint:enable:max-line-length

@Injectable()
export class CfCellHealthListConfigService extends BaseCfListConfig<CfCellHealthEntry> {

  dataSource: CfCellHealthDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  text = {
    title: 'Cell Health History',
    noEntries: 'Cell has no health history'
  };
  private init$: Observable<any>;

  private boolIndicatorConfig: TableCellBooleanIndicatorComponentConfig<CfCellHealthEntry> = {
    isEnabled: (row: CfCellHealthEntry) =>
      row ? row.state === CfCellHealthState.HEALTHY || row.state === CfCellHealthState.INITIAL_HEALTHY : false,
    type: BooleanIndicatorType.healthyUnhealthy,
    subtle: false,
    showText: true
  };

  constructor(
    private store: Store<CFAppState>,
    cloudFoundryCellService: CloudFoundryCellTabService,
    private datePipe: DatePipe,
    cfCellService: CfCellService
  ) {
    super();

    this.init$ = cfCellService.createCellMetricAction(cloudFoundryCellService.cfGuid, cloudFoundryCellService.cellId).pipe(
      first(),
      tap(action => {
        this.dataSource = new CfCellHealthDataSource(this.store, this, action);
      })
    );
    this.showCustomTime = true;
  }


  getInitialised = () => this.init$;
  getColumns = (): ITableColumn<CfCellHealthEntry>[] => [
    {
      columnId: 'dateTime',
      headerCell: () => 'Date/Time',
      cellFlex: '1',
      cellDefinition: {
        getValue: (entry: CfCellHealthEntry) => this.datePipe.transform(entry.timestamp * 1000, 'medium')
      },
      sort: {
        type: 'sort',
        orderKey: 'dateTime',
        field: 'timestamp'
      }
    },
    {
      columnId: 'state',
      headerCell: () => 'Cell Health Updated',
      cellComponent: TableCellBooleanIndicatorComponent,
      cellConfig: this.boolIndicatorConfig,
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'state',
        field: 'state'
      }
    },
  ];
  getDataSource = () => this.dataSource;
}
