import { CommonModule, AsyncPipe } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';

import type { GeneralEntityAppState } from '@stratosui/store';
import type { CFAppState } from '../../../../../../cf-app-state';
import { TableCellAppCfOrgSpaceBase } from '../TableCellAppCfOrgSpaceBase';

@Component({
  selector: 'app-table-cell-app-cforgspace-header',
  templateUrl: './table-cell-app-cforgspace-header.component.html',
  styleUrls: ['./table-cell-app-cforgspace-header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule
  ]
})
export class TableCellAppCfOrgSpaceHeaderComponent extends TableCellAppCfOrgSpaceBase {

  constructor(store: Store<GeneralEntityAppState>) {
    super(store);
    this.init();
  }

}
