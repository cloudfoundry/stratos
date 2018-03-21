import { Component, OnInit, ViewEncapsulation, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-tile-grid',
  templateUrl: './tile-grid.component.html',
  styleUrls: ['./tile-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TileGridComponent implements OnInit {

  @HostBinding('class.app-tile-grid-fit')
  @Input('fit') private fit = false;

  constructor() { }

  ngOnInit() {
  }

}
