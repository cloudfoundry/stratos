import { ChangeDetectionStrategy, AfterContentInit,
  Component,
  ContentChildren,
  HostBinding,
  OnDestroy,
  QueryList,
  ViewEncapsulation,
 } from '@angular/core';
import { Subscription } from 'rxjs';

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
export class TileGroupComponent implements AfterContentInit, OnDestroy {

  @HostBinding('class.tile-group-gutters') private hasGutters = true;

  @HostBinding('class.tile-group-6-cols') private isSixColumn = false;
  @HostBinding('class.tile-group-5-cols') private isFiveColumn = false;
  @HostBinding('class.tile-group-4-cols') private isFourColumn = false;
  @HostBinding('class.tile-group-3-cols') private isThreeColumn = false;
  @HostBinding('class.tile-group-2-cols') private isTwoColumn = false;
  @HostBinding('class.tile-group-1-cols') private isOneColumn = false;

  @ContentChildren(TileComponent) tiles!: QueryList<TileComponent>;

  private tilesSub?: Subscription;

  ngAfterContentInit() {
    this.updateColumns();
    // Re-evaluate when tiles are added/removed by @if conditionals
    this.tilesSub = this.tiles.changes.subscribe(() => this.updateColumns());
  }

  ngOnDestroy() {
    this.tilesSub?.unsubscribe();
  }

  private updateColumns() {
    const count = this.tiles.length;
    this.isSixColumn = (count === 6);
    this.isFiveColumn = (count === 5);
    this.isFourColumn = (count === 4);
    this.isThreeColumn = (count === 3);
    this.isTwoColumn = (count === 2);
    this.isOneColumn = (count === 1);
  }
}
