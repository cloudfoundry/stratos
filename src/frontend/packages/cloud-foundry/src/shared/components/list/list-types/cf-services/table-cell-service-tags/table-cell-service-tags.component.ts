import { Component, Input } from '@angular/core';
import { of } from 'rxjs';

import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IService } from '../../../../../../cf-api-svc.types';
import { ServiceTag } from '../cf-service-card/cf-service-card.component';

@Component({
  selector: 'app-table-cell-service-tags',
  templateUrl: './table-cell-service-tags.component.html',
  styleUrls: ['./table-cell-service-tags.component.scss']
})
export class TableCellServiceTagsComponent extends TableCellCustom<APIResource<IService>> {

  tags: AppChip<ServiceTag>[] = [];

  private service;
  @Input()
  set row(pService: APIResource<IService>) {
    this.service = pService;
    if (!pService) {
      return;
    }
    this.tags = pService.entity.tags.map(t => ({
      value: t,
      hideClearButton$: of(true)
    }));
  }
  get row(): APIResource<IService> {
    return this.service;
  }

  constructor() {
    super();
  }
}
