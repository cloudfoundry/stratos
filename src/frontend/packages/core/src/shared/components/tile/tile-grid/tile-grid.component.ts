import { ChangeDetectionStrategy, Component, ViewEncapsulation, HostBinding, Input  } from '@angular/core';

@Component({
  selector: 'app-tile-grid',
  templateUrl: './tile-grid.component.html',
  styleUrls: ['./tile-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileGridComponent {
  // TODO: Skipped for migration because:
  //  This input is used in combination with `@HostBinding` and migrating would
  //  break.
  @HostBinding('class.app-tile-grid-fit')
  @Input() public fit = false;
}
