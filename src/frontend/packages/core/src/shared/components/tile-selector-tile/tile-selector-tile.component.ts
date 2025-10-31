import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output  } from '@angular/core';

import { ITileConfig, ITileData, ITileGraphic } from '../tile/tile-selector.types';
import { CustomIconComponent } from '../custom-material/custom-material.component';

@Component({
  selector: 'app-tile-selector-tile',
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent
  ],
  templateUrl: './tile-selector-tile.component.html',
  styleUrls: ['./tile-selector-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileSelectorTileComponent<Y = ITileGraphic> {

  @Input() tile: ITileConfig<ITileData, Y>;

  @Input() active: boolean;

  @Input() smaller = false;

  @Input() compact = false;

  @Output() tileSelect = new EventEmitter<ITileConfig>();

  public onClick(tile: ITileConfig) {
    this.tileSelect.emit(tile);
  }

}
