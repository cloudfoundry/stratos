import { Component, OnInit, AfterContentInit, Input, ViewEncapsulation, HostBinding, ElementRef, Renderer } from '@angular/core';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TileComponent implements OnInit, AfterContentInit {

  @Input('size') size: number;

  @HostBinding('style.flex') private isSized: string;

  @HostBinding('style.width.%') private width: number;

  constructor() { }

  ngOnInit() {
  }

  ngAfterContentInit() {
    if (this.size) {
      this.isSized = 'none';
      this.width = this.size;
    }
  }
}
