import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, input, output } from '@angular/core';

import { ITileConfig, ITileIconConfig, ITileImgConfig } from '../tile/tile-selector.types';
import { CustomIconComponent } from '../custom-material/custom-material.component';

@Component({
  selector: 'app-tile-selector-tile',
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent
  ],
  templateUrl: './tile-selector-tile.component.html',
  styleUrls: ['./tile-selector-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileSelectorTileComponent {

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() tile!: ITileConfig;

  readonly active = input<boolean>();

  readonly smaller = input(false);

  readonly compact = input(false);

  readonly tileSelect = output<ITileConfig>();

  public onClick(tile: ITileConfig) {
    this.tileSelect.emit(tile);
  }

  // Narrow the icon/image graphic union for the template
  get iconGraphic(): ITileIconConfig | null {
    const graphic = this.tile ? this.tile.graphic : null;
    return graphic && 'matIcon' in graphic && graphic.matIcon ? graphic : null;
  }

  get imageGraphic(): ITileImgConfig | null {
    const graphic = this.tile ? this.tile.graphic : null;
    return graphic && 'location' in graphic ? graphic : null;
  }

}
