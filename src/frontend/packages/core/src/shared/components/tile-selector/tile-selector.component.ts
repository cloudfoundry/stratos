import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';

import { ITileConfig } from '../tile/tile-selector.types';
import { TileSelectorTileComponent } from '../tile-selector-tile/tile-selector-tile.component';

@Component({
  selector: 'app-tile-selector',
  standalone: true,
  imports: [
    CommonModule,
    TileSelectorTileComponent
  ],
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileSelectorComponent {
  public showingMore = false;
  readonly smallerTiles = input(false);
  readonly compactTiles = input(false);
  // See TileSelectorTileComponent.scaleIcon.
  readonly scaleIcons = input(false);
  // Use smaller tiles when more than this many are shown. 0: smallerTiles decides.
  readonly dynamicSmallerTiles = input(0);
  readonly options = input<ITileConfig[]>();

  // The tiles split into those shown and those behind "Show more". Options
  // that go back to empty keep the last tiles.
  private readonly groupedOptions = linkedSignal<ITileConfig[] | undefined, { show: ITileConfig[], hidden: ITileConfig[] }>({
    source: this.options,
    computation: (options, previous) => options
      ? { show: options.filter(option => !option.hidden), hidden: options.filter(option => option.hidden) }
      : previous?.value ?? { show: [], hidden: [] },
  });
  readonly shownOptions = computed(() => this.groupedOptions().show);
  readonly hiddenOptions = computed(() => this.groupedOptions().hidden);

  readonly useSmallerTiles = computed(() => {
    const limit = this.dynamicSmallerTiles();
    return limit ? this.shownOptions().length > limit : this.smallerTiles();
  });

  readonly selection = output<ITileConfig | null>();
  public selected: ITileConfig | null = null;

  constructor() { }

  public toggleMore() {
    this.showingMore = !this.showingMore;
  }

  selectionChange(tile: ITileConfig) {
    if (tile && tile === this.selected) {
      this.selected = null;
      this.selection.emit(null);
    } else {
      this.selection.emit(tile);
      this.selected = tile;
    }
  }

}
