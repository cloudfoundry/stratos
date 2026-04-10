import { Component , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { ISpace } from '../../../../../../cf-api.types';
import { CfRoleCheckboxComponent } from '../../../../cf-role-checkbox/cf-role-checkbox.component';

@Component({
  selector: 'app-table-cell-org-space-role',
  templateUrl: './table-cell-org-space-role.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CfRoleCheckboxComponent
  ]
})
export class TableCellRoleOrgSpaceComponent extends TableCellCustom<APIResource<ISpace>> { }
