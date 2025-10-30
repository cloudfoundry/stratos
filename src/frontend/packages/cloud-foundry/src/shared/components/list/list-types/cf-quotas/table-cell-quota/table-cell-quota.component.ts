import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../../../cf-api.types';

@Component({
  selector: 'app-table-cell-quota',
  templateUrl: './table-cell-quota.component.html',
  styleUrls: ['./table-cell-quota.component.scss'],
  standalone: true,
  imports: [
    RouterModule
  ]
})
export class TableCellQuotaComponent extends TableCellCustom<APIResource<IQuotaDefinition>> implements OnInit {
  quotaUrl: string[];

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.config?.baseUrl && Array.isArray(this.config.baseUrl)) {
      this.quotaUrl = [...this.config.baseUrl, this.row.metadata.guid];
    } else {
      // Fallback if config is not properly initialized
      this.quotaUrl = [];
    }
  }
}
