import { ChangeDetectionStrategy,
  Component,
  HostBinding,
  ViewEncapsulation,
  contentChildren,
 } from '@angular/core';

import { TileComponent } from '../tile/tile.component';

@Component({
  selector: 'app-tile-group',
  templateUrl: './tile-group.component.html',
  styleUrls: ['./tile-group.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The column class follows the number of tiles, including tiles added or
  // removed by an @if in the host.
  host: {
    '[class.tile-group-6-cols]': 'tiles().length === 6',
    '[class.tile-group-5-cols]': 'tiles().length === 5',
    '[class.tile-group-4-cols]': 'tiles().length === 4',
    '[class.tile-group-3-cols]': 'tiles().length === 3',
    '[class.tile-group-2-cols]': 'tiles().length === 2',
    '[class.tile-group-1-cols]': 'tiles().length === 1',
  },
})
export class TileGroupComponent {

  @HostBinding('class.tile-group-gutters') public hasGutters = true;

  readonly tiles = contentChildren(TileComponent);
}
