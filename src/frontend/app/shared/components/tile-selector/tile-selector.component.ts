import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export interface TileSelectorOption {
  key: number;
  label: string;
}

@Component({
  selector: 'app-tile-selector',
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss']
})
export class TileSelectorComponent implements OnInit {

  @Input() options: TileSelectorOption[];
  @Input() initialSelection: number;

  @Output() selection = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
    console.log(this.options);
    // setInterval(() => {
    //   console.log('sdfdsf');
    //   this.selection.emit(new Date().getMilliseconds() % 2 === 0 ? 0 : 1);
    // }, 5000);
  }

  selectionChange(event) {
    console.log(event);
    this.selection.emit(event.value);
  }

}
