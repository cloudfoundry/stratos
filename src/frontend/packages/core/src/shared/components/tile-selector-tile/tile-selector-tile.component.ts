import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ITileConfig, ITileData, ITileGraphic } from '../tile/tile-selector.types';

@Component({
  selector: 'app-tile-selector-tile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './tile-selector-tile.component.html',
  styleUrls: ['./tile-selector-tile.component.scss']
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
