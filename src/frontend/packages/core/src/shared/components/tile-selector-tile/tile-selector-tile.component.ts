import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ITileConfig } from '../tile/tile-selector.types';

@Component({
  selector: 'app-tile-selector-tile',
  templateUrl: './tile-selector-tile.component.html',
  styleUrls: ['./tile-selector-tile.component.scss']
})
export class TileSelectorTileComponent {

  @Input() tile: ITileConfig;

  @Input() active: boolean;

  @Output() tileSelect = new EventEmitter<ITileConfig>();

  public onClick(tile: ITileConfig) {
    this.tileSelect.emit(tile);
  }

}
