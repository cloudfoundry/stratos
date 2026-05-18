import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { TableCellCustom, TailwindDialogService } from '@stratosui/core';
import { EnvVarViewComponent } from '../../../../env-var-view/env-var-view.component';
import { ListAppEnvVar } from '../cf-app-variables.types';

@Component({
  selector: 'app-table-cell-edit-variable',
  templateUrl: './table-cell-edit-variable.component.html',
  styleUrls: ['./table-cell-edit-variable.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class TableCellEditVariableComponent extends TableCellCustom<ListAppEnvVar> {
  private dialog = inject(TailwindDialogService);


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
  };

}
