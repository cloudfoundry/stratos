import { Component, OnInit } from '@angular/core';

import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../../../core/cf-api.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-quota',
  templateUrl: './table-cell-quota.component.html',
  styleUrls: ['./table-cell-quota.component.scss']
})
export class TableCellQuotaComponent extends TableCellCustom<APIResource<IQuotaDefinition>> implements OnInit {
  quotaUrl: string[];

  constructor()  {
    super();
  }

  ngOnInit() {
    this.quotaUrl = [...this.config.baseUrl, this.row.metadata.guid];
  }
}
