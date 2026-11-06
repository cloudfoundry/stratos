import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, untracked } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { EndpointModel, EndpointsDataService, getFullEndpointApiUrl } from '@stratosui/store';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { EndpointsSignalService } from '../../../../core/signals/endpoints-signal.service';
import { CopyToClipboardComponent } from '../../copy-to-clipboard/copy-to-clipboard.component';
import { CustomTooltipDirective } from '../../custom-tooltip/custom-tooltip.directive';
import { TableCellCustom } from '../../signal-list/cell-base';
import { RowWithEndpointId } from '../table-cell-endpoint-name/table-cell-endpoint-name.component';

@Component({
  selector: 'app-table-cell-endpoint-address',
  templateUrl: './table-cell-endpoint-address.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CopyToClipboardComponent,
    CustomTooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellEndpointAddressComponent extends TableCellCustom<EndpointModel | RowWithEndpointId>  {
  private endpointsSignal = inject(EndpointsSignalService);
  private endpointsData = inject(EndpointsDataService);
  // Signal-native projection of the endpoints slice. Pre-built once
  // so a new row doesn't recreate a `toObservable` bridge.
  private endpoints$ = toObservable(this.endpointsSignal.endpoints);

  private readonly endpointId = computed<string>(() => {
    const row = this.row() as any;
    return row['endpointId'] || row['guid'];
  });

  // One stream per row id. W36-B Wave 3: replace EntityService.waitForEntity$
  // with the signal-native EndpointsDataService.waitFor() promise lifted to
  // an Observable. waitFor() blocks until the endpoint map is populated then
  // returns the EndpointModel — same single-emit semantics the legacy
  // waitForEntity$ provided. It reads the endpoint map, so it runs untracked:
  // the stream must depend on the row's id alone.
  public readonly endpointAddress$ = computed<Observable<string>>(() => {
    const id = this.endpointId();
    return from(untracked(() => this.endpointsData.waitFor(id))).pipe(
      map((data: EndpointModel) => getFullEndpointApiUrl(data))
    );
  });
  public readonly isDuplicate$ = computed<Observable<boolean>>(() => this.endpointAddress$().pipe(
    switchMap(address =>
      this.endpoints$.pipe(
        map(entities => Object.values(entities).filter(e => getFullEndpointApiUrl(e) === address).length > 1)
      )
    )
  ));
}
