import { ChangeDetectionStrategy, Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';

import { getRowMetadata, EntitySchema, APIResource } from '@stratosui/store';

import { AppMonitorComponentTypes, AppActionMonitorIconComponent } from '../../../app-action-monitor-icon/app-action-monitor-icon.component';
import { TableCellCustom } from '../../list.types';

export interface ITableCellRequestMonitorIconConfig {
  entityKey: string;
  schema: EntitySchema;
  monitorState?: AppMonitorComponentTypes;
  updateKey?: string;
  getId?: (element: any) => string;
}

interface Config<T> {
  getConfig: (row: T) => ITableCellRequestMonitorIconConfig;
}

@Component({
selector: 'app-table-cell-request-monitor-icon',
  templateUrl: './table-cell-request-monitor-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AppActionMonitorIconComponent
]
})
export class TableCellRequestMonitorIconComponent<T = any> extends TableCellCustom<T, Config<T>> implements OnInit, OnChanges {
  private cdr = inject(ChangeDetectorRef);

  public configObj!: ITableCellRequestMonitorIconConfig;

  public id!: string;

  ngOnInit() {
    this.updateConfig();
  }

  ngOnChanges(changes: SimpleChanges) {
    // When row or config changes, update the configuration
    // This is necessary in zoneless mode with OnPush change detection
    if (changes['row'] || changes['config']) {
      this.updateConfig();
    }
  }

  private updateConfig() {
    this.configObj = this.config.getConfig(this.row);

    if (this.configObj && this.configObj.getId) {
      this.id = this.configObj.getId(this.row);
      /* tslint:disable-next-line:no-string-literal  */
    } else if (this.row && (this.row as any)['metadata']) {
      const row = this.row as unknown as APIResource;
      this.id = getRowMetadata(row);
    } else {
      throw new Error('Cannot get id for request monitor cell');
    }
    // Mark for check to ensure template expressions re-evaluate in zoneless mode
    this.cdr.markForCheck();
  }

}
