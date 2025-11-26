import { Component , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { ISpace } from '../../../../../../cf-api.types';
import { CfRoleCheckboxComponent } from '../../../../cf-role-checkbox/cf-role-checkbox.component';

export interface CfOrgSpaceRoleConfig {
  role: string;
  isSpace: boolean;
}

@Component({
  selector: 'app-table-cell-org-space-role',
  templateUrl: './table-cell-org-space-role.component.html',
  styleUrls: ['./table-cell-org-space-role.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CfRoleCheckboxComponent
  ]
})
export class TableCellRoleOrgSpaceComponent extends TableCellCustom<APIResource<ISpace>, CfOrgSpaceRoleConfig> { }
