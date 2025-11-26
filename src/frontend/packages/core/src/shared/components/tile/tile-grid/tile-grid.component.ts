import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, } from '@angular/core';

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
  @Input() fit = true;
}
