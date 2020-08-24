import { Component, Input, EventEmitter, Output } from '@angular/core';

import { ITileConfig, ITileIconConfig, ITileImgConfig, ITileData } from '../tile/tile-selector.types';

@Component({
  selector: 'app-tile-selector-tile',
  templateUrl: './tile-selector-tile.component.html',
  styleUrls: ['./tile-selector-tile.component.scss']
})
export class TileSelectorTileComponent<Y = ITileIconConfig | ITileImgConfig> {

  @Input() tile: ITileConfig<ITileData, Y>;

  @Input() active: boolean;

  @Output() tileSelect = new EventEmitter<ITileConfig>();

  public onClick(tile: ITileConfig) {
    this.tileSelect.emit(tile);
  }

}
