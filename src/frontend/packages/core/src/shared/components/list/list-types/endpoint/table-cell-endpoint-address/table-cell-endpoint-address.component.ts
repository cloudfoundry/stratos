import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { EndpointModel, getFullEndpointApiUrl, stratosEntityCatalog } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { CopyToClipboardComponent } from '../../../../copy-to-clipboard/copy-to-clipboard.component';
import { CustomTooltipDirective } from '../../../../custom-tooltip/custom-tooltip.directive';
import { TableCellCustom } from '../../../list.types';
import { RowWithEndpointId } from '../table-cell-endpoint-name/table-cell-endpoint-name.component';

@Component({
  selector: 'app-table-cell-endpoint-address',
  templateUrl: './table-cell-endpoint-address.component.html',
  styleUrls: ['./table-cell-endpoint-address.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CopyToClipboardComponent,
    CustomTooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellEndpointAddressComponent extends TableCellCustom<EndpointModel | RowWithEndpointId>  {
  public endpointAddress$!: Observable<string>;
  public isDuplicate$!: Observable<boolean>;

  @Input()
  set row(row: EndpointModel | RowWithEndpointId) {
    super.row = row;
    /* tslint:disable-next-line:no-string-literal */
    const id = (row as any)['endpointId'] || (row as any)['guid'];
    this.endpointAddress$ = stratosEntityCatalog.endpoint.store.getEntityService(id).waitForEntity$.pipe(
      map(data => data.entity),
      map((data: any) => getFullEndpointApiUrl(data))
    );
    this.isDuplicate$ = this.endpointAddress$.pipe(
      switchMap(address =>
        stratosEntityCatalog.endpoint.store.getAll.getPaginationService().entities$.pipe(
          map(endpoints => endpoints.filter(e => getFullEndpointApiUrl(e.entity) === address).length > 1)
        )
      )
    );
  }
}
