import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, Input, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CustomTooltipDirective } from '../../../../custom-tooltip/custom-tooltip.directive';
import { RouterModule } from '@angular/router';
import { entityCatalog, EndpointModel, EndpointsDataService } from '@stratosui/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { EndpointsService } from '../../../../../../core/endpoints.service';
import { TableCellCustom } from '../../../list.types';
import { CustomIconComponent } from '../../../../../../shared/components/custom-material/custom-material.component';

export interface RowWithEndpointId {
  endpointId: string;
}

@Component({
  selector: 'app-table-cell-endpoint-name',
  templateUrl: './table-cell-endpoint-name.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
    CustomTooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellEndpointNameComponent extends TableCellCustom<EndpointModel | RowWithEndpointId>  {

  private endpointsData = inject(EndpointsDataService);
  private injector = inject(Injector);

  public endpoint$!: Observable<any>;

  @Input()
  set row(row: EndpointModel | RowWithEndpointId) {
    super.row = row;
    /* tslint:disable-next-line:no-string-literal */
    const id = (row as any)['endpointId'] || (row as any)['guid'];
    // W36-B Wave 3: read endpoint via EndpointsDataService signal
    // bridge instead of legacy EntityMonitor.entity$.
    this.endpoint$ = toObservable(this.endpointsData.endpointById(id), { injector: this.injector }).pipe(
      filter((data): data is EndpointModel => !!data),
      map(data => {
        const ep = entityCatalog.getEndpoint(data.cnsi_type, data.sub_type).definition;
        return {
          ...data,
          canShowLink: data.connectionStatus === 'connected' || ep.unConnectable,
          link: EndpointsService.getLinkForEndpoint(data)
        };
      })
    );
  }
}
