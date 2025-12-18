import { ChangeDetectionStrategy, AfterContentInit,
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
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileGroupComponent implements OnInit, AfterContentInit {

  constructor() { }

  @HostBinding('class.tile-group-gutters') hasGutters = true;

  @HostBinding('class.tile-group-6-cols') isSixColumn = false;
  @HostBinding('class.tile-group-4-cols') isFourColumn = false;
  @HostBinding('class.tile-group-3-cols') isThreeColumn = false;
  @HostBinding('class.tile-group-2-cols') isTwoColumn = false;
  @HostBinding('class.tile-group-1-cols') isOneColumn = false;

  @ContentChildren(TileComponent) tiles!: QueryList<TileComponent>;

  ngOnInit() { }

  ngAfterContentInit() {
    this.isSixColumn = (this.tiles.length === 6);
    this.isFourColumn = (this.tiles.length === 5);
    this.isThreeColumn = (this.tiles.length === 3);
    this.isTwoColumn = (this.tiles.length === 2);
    this.isOneColumn = (this.tiles.length === 1);
  }

}
