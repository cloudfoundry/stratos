import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output  } from '@angular/core';

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

  @Input() tile!: ITileConfig;

  @Input() active!: boolean;

  @Input() smaller = false;

  @Input() compact = false;

  @Output() tileSelect = new EventEmitter<ITileConfig>();

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
