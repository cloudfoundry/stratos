import { Component, Input , ChangeDetectionStrategy } from '@angular/core';


import { ClickStopPropagationDirective } from '../../../../../../../../core/src/core/click-stop-propagation.directive';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IService, IServiceExtra } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service-references',
  templateUrl: './table-cell-service-references.component.html',
  styleUrls: ['./table-cell-service-references.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ClickStopPropagationDirective
]
})
export class TableCellServiceReferencesComponent extends TableCellCustom<APIResource<IService>> {

  extraInfo!: IServiceExtra;

  @Input()
  set row(pService: APIResource<IService>) {
    super.row = pService;
    if (!!pService && !!pService.entity.extra && !this.extraInfo) {
      try {
        this.extraInfo = JSON.parse(pService.entity.extra);
      } catch { }
    }

  }

  hasDocumentationUrl() {
    return !!(this.getDocumentationUrl());
  }
  getDocumentationUrl() {
    return this.extraInfo && this.extraInfo.documentationUrl;
  }

  hasSupportUrl() {
    return !!(this.getSupportUrl());
  }

  getSupportUrl() {
    return this.extraInfo && this.extraInfo.supportUrl;
  }

}
