import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

@Component({
  selector: 'app-tile-grid',
  templateUrl: './tile-grid.component.html',
  styleUrls: ['./tile-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { '[class.app-tile-grid-fit]': 'fit()' },
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileGridComponent {
  public readonly fit = input(false);
}
