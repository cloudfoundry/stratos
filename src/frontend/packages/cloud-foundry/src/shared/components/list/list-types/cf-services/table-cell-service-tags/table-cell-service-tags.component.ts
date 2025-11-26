import { Component, Input , ChangeDetectionStrategy } from '@angular/core';
import { of } from 'rxjs';

import { type AppChip, AppChipsComponent, TableCellCustom } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IService } from '../../../../../../cf-api-svc.types';
import type { ServiceTag } from '../cf-service-card/cf-service-card.component';

@Component({
  selector: 'app-table-cell-service-tags',
  templateUrl: './table-cell-service-tags.component.html',
  styleUrls: ['./table-cell-service-tags.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppChipsComponent
  ]
})
export class TableCellServiceTagsComponent extends TableCellCustom<APIResource<IService>> {

  tags: AppChip<ServiceTag>[] = [];

  @Input()
  set row(pService: APIResource<IService>) {
    super.row = pService;
    if (!pService) {
      return;
    }
    this.tags = pService.entity.tags.map(t => ({
      value: t,
      hideClearButton$: of(true)
    }));
  }
  get row(): APIResource<IService> {
    return super.row;
  }

}
