import { Component , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  CustomTooltipDirective,
  CardWrapperComponent,
  CardContentComponent
} from '@stratosui/core';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import {
  CfCellHealthListConfigService,
} from '../../../../../../shared/components/list/list-types/cf-cell-health/cf-cell-health-list-config.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CardStatusComponent } from '../../../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { MetadataItemComponent } from '../../../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { BooleanIndicatorComponent } from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { TileGridComponent } from '../../../../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../../../../../core/src/shared/components/tile/tile/tile.component';
import { CardNumberMetricComponent } from '../../../../../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';
import { ListComponent } from '../../../../../../../../core/src/shared/components/list/list.component';

@Component({
  selector: 'app-cloud-foundry-cell-summary',
  templateUrl: './cloud-foundry-cell-summary.component.html',
  styleUrls: ['./cloud-foundry-cell-summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    CustomTooltipDirective,
    CardWrapperComponent,
    CardContentComponent,
    CardStatusComponent,
    MetadataItemComponent,
    BooleanIndicatorComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
    ListComponent
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfCellHealthListConfigService
    }
  ]
})
export class CloudFoundryCellSummaryComponent {

  public status$: Observable<StratosStatus>;

  constructor(
    public cfCellService: CloudFoundryCellService
  ) {
    this.status$ = cfCellService.healthy$.pipe(
      map(health => {
        if (health === undefined) {
          return StratosStatus.NONE;
        }
        return health === '0' ? StratosStatus.OK : StratosStatus.ERROR;
      })
    );
  }
}
