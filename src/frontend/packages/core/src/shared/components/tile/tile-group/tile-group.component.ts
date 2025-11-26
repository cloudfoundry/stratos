import { ChangeDetectionStrategy, type AfterContentInit,
  Component,
  ContentChildren,
  type OnInit,
  type QueryList,
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

  @ContentChildren(TileComponent) tiles!: QueryList<TileComponent>;

  isSixColumn = false;
  isFourColumn = false;
  isThreeColumn = false;
  isTwoColumn = false;
  isOneColumn = false;

  ngOnInit() {
    // Component initialization
  }

  ngAfterContentInit() {
    this.isSixColumn = (this.tiles.length === 6);
    this.isFourColumn = (this.tiles.length === 5);
    this.isThreeColumn = (this.tiles.length === 3);
    this.isTwoColumn = (this.tiles.length === 2);
    this.isOneColumn = (this.tiles.length === 1);
  }

}
