import { Component, OnInit, AfterContentInit, Input, ViewEncapsulation, HostBinding, ElementRef, Renderer } from '@angular/core';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TileComponent implements OnInit, AfterContentInit {

  @Input('size') size: number;

  @HostBinding('class.app-tile-sized') private isSized = false;

  @HostBinding('style.width.%') private width: number;

  constructor() { }

  ngOnInit() {
  }

  ngAfterContentInit() {
    if (this.size) {
      this.isSized = true;
      this.width = this.size;
    }
  }
}
