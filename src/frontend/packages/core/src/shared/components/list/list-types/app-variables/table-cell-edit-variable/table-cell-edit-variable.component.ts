/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';

import { EnvVarViewComponent } from '../../../../env-var-view/env-var-view.component';
import { TableCellCustom } from '../../../list.types';
import { ListAppEnvVar } from '../cf-app-variables-data-source';

@Component({
  selector: 'app-table-cell-edit-variable',
  templateUrl: './table-cell-edit-variable.component.html',
  styleUrls: ['./table-cell-edit-variable.component.scss']
})
export class TableCellEditVariableComponent extends TableCellCustom<ListAppEnvVar> {

  constructor(
    private dialog: MatDialog,
  ) {
    super();
  }

  showPopup = () => {
    let value = this.row.value;
    if (this.row.name === 'STRATOS_PROJECT') {
      value = JSON.parse(this.row.value);
    }
    this.dialog.open(EnvVarViewComponent, {
      data: {
        key: this.row.name,
        value
      },
      disableClose: false
    });
  }

}
