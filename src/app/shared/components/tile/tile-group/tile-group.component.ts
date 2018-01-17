import { Component, OnInit, AfterContentInit, HostBinding, ContentChildren, QueryList, ViewEncapsulation } from '@angular/core';

import { TileComponent} from '../tile/tile.component';
import { Subscription } from 'rxjs/Rx';

@Component({
  selector: 'app-tile-group',
  templateUrl: './tile-group.component.html',
  styleUrls: ['./tile-group.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TileGroupComponent implements OnInit, AfterContentInit {

  constructor() { }

  @HostBinding('class.tile_group__gutters') private hasGutters = true;

  @HostBinding('class.tile-group__3-cols') private isThreeColumn = false;
  @HostBinding('class.tile-group__2-cols') private isTwoColumn = false;
  @HostBinding('class.tile-group__1-cols') private isOneColumn = false;

  @ContentChildren(TileComponent) tiles: QueryList<TileComponent>;

  ngOnInit() {}

  ngAfterContentInit() {
    this.isThreeColumn = (this.tiles.length === 3);
    this.isTwoColumn = (this.tiles.length === 2);
    this.isOneColumn = (this.tiles.length === 1);
  }

}
