import { Component, OnInit, Input } from '@angular/core';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { ListAppEnvVar } from '../cf-app-variables-data-source';
import { MatDialog } from '@angular/material';
import { EnvVarViewComponent } from '../../../../env-var-view/env-var-view.component';
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
      value = JSON.parse(this.row.value)
    }
    this.dialog.open(EnvVarViewComponent, {
      data: {
        key: this.row.name,
        value: value
      },
      disableClose: false
    });
  }

}
