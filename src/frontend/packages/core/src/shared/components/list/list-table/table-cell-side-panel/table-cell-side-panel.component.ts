import { Component, ComponentFactoryResolver, Input } from '@angular/core';

import { SidePanelService } from '../../../../services/side-panel.service';
import { TableCellCustom } from '../../list.types';
import { CellConfigFunction } from '../table.types';

export interface TableCellSidePanelConfig<T> {
  text: string;
  sidePanelComponent: any; // PreviewableComponent
  sidePanelConfig: T;
}

@Component({
  selector: 'app-table-cell-side-panel',
  templateUrl: './table-cell-side-panel.component.html',
  styleUrls: ['./table-cell-side-panel.component.scss']
})
export class TableCellSidePanelComponent<T = any, A = any> extends TableCellCustom<T> {

  public actualConfig: TableCellSidePanelConfig<A>;

  private pRow: T;
  @Input('row')
  get row(): T { return this.pRow; }
  set row(row: T) {
    this.pRow = row;
    this.updateConfig();
  }

  private pConfig: object | CellConfigFunction<T>;
  @Input('config')
  get config() { return this.pConfig; }
  set config(config: object | CellConfigFunction<T>) {
    this.pConfig = config;
    this.updateConfig();
  }

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private previewPanel: SidePanelService
  ) {
    super();
  }

  showSidePanel() {
    this.previewPanel.show(
      this.actualConfig.sidePanelComponent,
      this.actualConfig.sidePanelConfig,
      this.componentFactoryResolver
    );
  }

  updateConfig() {
    if (typeof (this.config) === 'function') {
      if (this.row && this.config) {
        const configFn = this.config as CellConfigFunction<T>;
        this.actualConfig = configFn(this.row);
      }
    } else {
      this.actualConfig = this.config as TableCellSidePanelConfig<A>;
    }
  }

}
