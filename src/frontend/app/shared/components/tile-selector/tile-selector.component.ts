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

  constructor() { }

  selectionChange(event) {
    this.selection.emit(event.value);
  }

}
