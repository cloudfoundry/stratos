import { Component, OnInit } from '@angular/core';
import { getRowMetadata } from '@stratosui/store';

import { EntitySchema } from '../../../../../../../store/src/helpers/entity-schema';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppMonitorComponentTypes } from '../../../app-action-monitor-icon/app-action-monitor-icon.component';
import { TableCellCustom } from '../../list.types';

export interface ITableCellRequestMonitorIconConfig {
  entityKey: string;
  schema: EntitySchema;
  monitorState?: AppMonitorComponentTypes;
  updateKey?: string;
  getId?: (element) => string;
}

interface Config<T> {
  getConfig: (T) => ITableCellRequestMonitorIconConfig;
}

@Component({
  selector: 'app-table-cell-request-monitor-icon',
  templateUrl: './table-cell-request-monitor-icon.component.html',
  styleUrls: ['./table-cell-request-monitor-icon.component.scss']
})
export class TableCellRequestMonitorIconComponent<T> extends TableCellCustom<T, Config<T>> implements OnInit {
  public configObj: ITableCellRequestMonitorIconConfig;

  // @Input()
  // public config: (element) => ITableCellRequestMonitorIconConfig;

  // @Input()
  // public row;

  public id: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.configObj = this.config.getConfig(this.row);

    if (this.configObj && this.configObj.getId) {
      this.id = this.configObj.getId(this.row);
      /* tslint:disable-next-line:no-string-literal  */
    } else if (this.row && this.row['metadata']) {
      const row = this.row as unknown as APIResource;
      this.id = getRowMetadata(row);
    } else {
      throw new Error('Cannot get id for request monitor cell');
    }
  }

}
