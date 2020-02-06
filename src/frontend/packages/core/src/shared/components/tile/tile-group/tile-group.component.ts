import {
  AfterContentInit,
  Component,
  ContentChildren,
  HostBinding,
  OnInit,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';

import { TileComponent } from '../tile/tile.component';

@Component({
  selector: 'app-tile-group',
  templateUrl: './tile-group.component.html',
  styleUrls: ['./tile-group.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TileGroupComponent implements OnInit, AfterContentInit {

  constructor() { }

  @HostBinding('class.tile-group-gutters') private hasGutters = true;

  @HostBinding('class.tile-group-6-cols') private isSixColumn = false;
  @HostBinding('class.tile-group-4-cols') private isFourColumn = false;
  @HostBinding('class.tile-group-3-cols') private isThreeColumn = false;
  @HostBinding('class.tile-group-2-cols') private isTwoColumn = false;
  @HostBinding('class.tile-group-1-cols') private isOneColumn = false;

  @ContentChildren(TileComponent) tiles: QueryList<TileComponent>;

  ngOnInit() { }

  ngAfterContentInit() {
    this.isSixColumn = (this.tiles.length === 6);
    this.isFourColumn = (this.tiles.length === 5);
    this.isThreeColumn = (this.tiles.length === 3);
    this.isTwoColumn = (this.tiles.length === 2);
    this.isOneColumn = (this.tiles.length === 1);
  }

}
