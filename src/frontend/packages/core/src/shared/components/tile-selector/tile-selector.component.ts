import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ITileConfig } from '../tile/tile-selector.types';

@Component({
  selector: 'app-tile-selector',
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss']
})
export class TileSelectorComponent {
  public pOptions: ITileConfig[] = [];
  public hiddenOptions: ITileConfig[] = [];
  public showingMore = false;
  @Input() set options(options: ITileConfig[]) {
    const groupedOptions = options.reduce((grouped, option) => {
      if (option.hidden) {
        grouped.hidden.push(option);
      } else {
        grouped.show.push(option);
      }
      return grouped;
    }, {
        show: [],
        hidden: []
      });
    this.pOptions = groupedOptions.show;
    this.hiddenOptions = groupedOptions.hidden;
  }

  get options() {
    return this.pOptions;
  }

  @Output() selection = new EventEmitter<ITileConfig>();
  public selected: ITileConfig;

  constructor() { }

  public toggleMore() {
    this.showingMore = !this.showingMore;
  }

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
