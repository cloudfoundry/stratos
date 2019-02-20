import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ITileConfig } from '../tile/tile-selector.types';


@Component({
  selector: 'app-tile-selector',
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss']
})
export class TileSelectorComponent {

  @Input() options: ITileConfig[];

  @Output() selection = new EventEmitter<ITileConfig>();
  public selected: ITileConfig;

  constructor() { }

  selectionChange(tile: ITileConfig) {
    if (tile && tile === this.selected) {
      this.selected = null;
      this.selection.emit(null);
    } else {
      this.selection.emit(tile);
      this.selected = tile;
    }
  }

}
